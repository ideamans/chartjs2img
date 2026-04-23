---
title: アーキテクチャ
description: chartjs2img の単一リクエストパス - HTTP 受付からPNG 出力まで、認証・キャッシュ・セマフォ・ブラウザ / ページライフサイクルを解説。
---

# アーキテクチャ

単一のリクエストパス — HTTP 受付 → キャッシュ済みまたは新規レンダー →
画像の返却 — に、興味深いロジックのほとんどが詰まっています。

## フル フロー

```
  POST /render (または GET /render、または CLI render)
       │
       ▼
  ┌───────────┐
  │   認証    │   server.ts::checkAuth
  │  チェック │   → API_KEY 設定ありで不一致なら 401
  └───────────┘
       │ OK
       ▼
  ┌───────────┐
  │ ハッシュ  │   cache.ts::computeHash
  │   算出    │   → SHA-256(正規化(リクエスト))[0:16]
  └───────────┘
       │
       ▼
  ┌───────────┐
  │ キャッシュ│   cache.ts::getCache
  │  ルックア │   → ヒット? X-Cache-Hit: true で画像返却
  │  ップ     │
  └───────────┘
       │ ミス
       ▼
  ┌───────────┐
  │ セマフォ  │   semaphore.ts::acquire
  │  取得     │   → active == CONCURRENCY (既定 8) なら待機
  └───────────┘
       │
       ▼
  ┌───────────┐
  │キャッシュ │   cache.ts::getCache (再)
  │ ダブル    │   → 待機中に並行リクエストが完了していれば拾う
  │ チェック  │
  └───────────┘
       │ 依然ミス
       ▼
  ┌───────────┐
  │ ブラウザ  │   renderer.ts::ensureBrowser
  │  確保     │   → 動いていなければ puppeteer 起動
  └───────────┘
       │
       ▼
  ┌───────────┐
  │ 新しい    │   b.newPage() + schedulePageCleanup
  │ ページ    │   → PAGE_TIMEOUT_SECONDS 後に強制クローズ予約
  └───────────┘
       │
       ▼
  ┌───────────┐
  │ チャート  │   template.ts::buildHtml + page.goto(dataUrl)
  │ 描画      │   → window.__chartRendered === true を待機
  │           │   → window.__chartMessages を回収
  └───────────┘
       │
       ▼
  ┌───────────┐
  │ スクリーン│   container.screenshot({ type, quality })
  │ ショット  │   → PNG / JPEG バイトを含む Buffer
  └───────────┘
       │
       ▼
  ┌───────────┐
  │ キャッシュ│   cache.ts::setCache
  │  保存     │   → MAX_ENTRIES を超えていれば古いものを追い出し
  └───────────┘
       │
       ▼
  ┌───────────┐
  │ ページ    │   clearPageCleanup + page.close()
  │  クローズ │
  └───────────┘
       │
       ▼
  ┌───────────┐
  │ セマフォ  │   semaphore.ts::release
  │  解放     │   → キューの次のレンダーを起床
  └───────────┘
       │
       ▼
  レスポンス: 画像 + X-Cache-* ヘッダー + X-Chart-Messages (該当時)
```

## キーとなる設計判断

### キャッシュは意図的に粗粒度

`computeHash` は `{chart, width, height, devicePixelRatio,
backgroundColor, format, quality}` を JSON.stringify した正規化文字列
をハッシュします。つまり:

- `chart` のキー順の違いはハッシュに影響 **しません** (JSON.stringify は
  キーを並べ替えませんが、同じ論理オブジェクトを同じように送るクライアント
  なら実運用上まず衝突しません)。
- データセットの値がわずかでも変われば、新しいハッシュが出ます。

病的なハッシュチャーンが起きる場合はキャッシュを無効化してください
(`CACHE_MAX_ENTRIES=0`)。

### セマフォとキャッシュは独立

キャッシュヒットはセマフォを取得 **しません** — 即座にキャッシュバッファ
を返します。これにより繰り返し同じリクエストがブラウザタブを消費しません。

### 1 ブラウザ、多ページ

`browser` はモジュールレベルのシングルトン。各レンダリングは独自のタブ
(`b.newPage()`) を取ります。`browser.on('disconnected')` で参照を null 化し、
次のリクエストで再起動。タブは時間制御されており、`PAGE_TIMEOUT_SECONDS`
を超えたレンダリングはクリーンアップタイマがタブを強制クローズ — ハング
レンダーによる孤児ページリークを防ぎます。

### Chromium は `--no-sandbox` で起動

Docker 内で root 実行するための必須。これなしでは Chromium が起動
拒否します。Docker 外で root 実行するケースは既にもっと大きな問題が
あると思ってください。

### HTML テンプレートは静的

`template.ts::buildHtml` は、全プラグインの CDN `<script>` タグ、インライン
CSS、および次を行う IIFE を含む単一の HTML 文書を生成します:

1. 自動登録しないプラグインを登録 (datalabels、chartjs-chart-geo)。
2. アニメーションを強制 OFF (`page.screenshot` が安定フレームを捕捉できるように)。
3. `console.warn` / `console.error` をラップして `window.__chartMessages` に保存。
4. try/catch で `Chart` インスタンスを作成。エラーは `window.__chartError` に格納。
5. `window.__chartRendered = true` でレンダリング完了シグナル。

このテンプレートが「任意の Chart.js 設定を描画する」ことを実現しています
— 単一のページ初期化が全チャートタイプと全プラグインに対応。

### プラグインはページ初期化時に CDN から読み込み

Chart.js プラグインを Node 側の JavaScript にバンドルしていません。
Chromium 内で jsdelivr から毎ページロードで取得しています。この結果:

- ブラウザコールドスタート後の初回レンダーは遅くなる (ネットワークラウンドトリップ)。
- オフライン運用にはローカルミラーが必要 (同じパスを配信する nginx、または
  puppeteer のリクエストインターセプトをキャッシュディレクトリに向ける)。

代わりに得られるメリット: プラグインバージョンアップは [template.ts](./modules#template-ts)
の一行変更だけで済み、再ビルド不要。

## フローに含まれないもの

- **データベースなし。** キャッシュはメモリ内で、再起動で失われます。
- **認証状態なし。** 各リクエストはキーを持つか持たないか。
- **WebSocket / SSE なし。** 単なる HTTP 1.1 リクエスト/レスポンス。
- **マルチプロセスレンダリングなし。** ロードバランサの裏で複数インスタンスを
  走らせて水平スケール。インスタンス間でキャッシュは共有しません (意図的な設計 — CDN が適切なレイヤー)。

## 同時実行系のチューニングツマミ

| 環境変数                  | 既定値   | 変わること                                                      |
| ------------------------- | -------- | --------------------------------------------------------------- |
| `CONCURRENCY`             | `8`      | セマフォスロット上限 — 同時ブラウザタブ数                        |
| `PAGE_TIMEOUT_SECONDS`    | `60`     | 1 レンダリングの上限時間。超えるとタブを強制終了                 |
| `CACHE_MAX_ENTRIES`       | `1000`   | LRU 容量                                                         |
| `CACHE_TTL_SECONDS`       | `3600`   | エントリ毎の TTL                                                 |

ユーザー向け解説は [環境変数 (HTTP サーバー)](../guide/http/env-vars)
および [環境変数 (CLI)](../guide/cli/env-vars) を参照。
