---
title: エラーハンドリング
description: chartjs2img がどのようにサーバーエラー・Chart.js レンダリングエラー・データエラーを区別し、それぞれが呼び出し元にどう現れるか。
---

# エラーハンドリング

chartjs2img は 3 種類の失敗を扱います。どれがどれかとどう現れるかを
把握しておくとデバッグ時間を大幅に節約できます。

## 1. サーバーエラー (4xx / 5xx HTTP、非 0 CLI 終了)

これは **リクエスト自体が壊れている** 状態。例:

| シナリオ                              | HTTP ステータス | CLI 終了 |
| ------------------------------------- | --------------- | -------- |
| 必要な API キーが無い                 | `401`           | *(該当なし — CLI に認証なし)* |
| `POST /render` で `chart` 欠落        | `500`           | 1        |
| GET `/render` で `chart=` パラメータ無し | `400`         | *(該当なし)* |
| Chromium が起動できない (バイナリ無し) | `500`          | 1        |
| Chromium がレンダリング中にクラッシュ | `500`           | 1        |

`server.ts::handleRequest` (レンダー周りの try/catch) と `cli.ts::cliRender`
(`JSON.parse` 失敗で exit、レンダラ例外は伝播) で処理。

## 2. Chart.js レンダリングエラー (画像は返却される)

これは **設定自体がおかしい** がブラウザはクラッシュしていない状態。
例: `chart.type` の typo、dataset フィールド欠落、Chart.js がパースできない
スケール設定など。

chartjs2img の契約:

- **レンダリング自体は完了。** 画像は返却される (空や欠損かもしれないが)。
- **終了コードは `0`** (CLI) / HTTP ステータスは `200`。
- **メッセージは** 次で通知:
  - HTTP → `X-Chart-Messages: [{"level":"error","message":"…"}, …]` ヘッダー
  - CLI → `[chart ERROR] <メッセージ>` / `[chart WARN] <メッセージ>` を stderr に

これは意図的な設計: LLM エージェントがメッセージを観測して設定を修正し
再試行できるようにするため。画像が空の理由を推測する必要はありません。
ユーザー向けの解説は [エラーフィードバック](../guide/error-feedback) を参照。

### メッセージの捕捉方法

`renderer.ts` は 2 つのチャネルを繋ぎます:

```ts
page.on('console', msg => { /* error/warning コンソール呼び出しを捕捉 */ })
page.on('pageerror', err => { /* 未捕捉例外を捕捉 */ })
```

ブラウザ内 (`template.ts`) の IIFE は `console.warn` / `console.error` を
ラップして `window.__chartMessages` にも push、`try { new Chart(…) }` は
構築時エラーを `window.__chartError` にキャッチ。
`waitForFunction('window.__chartRendered === true')` の後、Node 側が
両方読み取ってマージ (重複排除)。

なぜ二重取り? Chart.js エラーの一部は Node 側 `console` リスナーが付く前に
発火するため、ブラウザ内インターセプトでそれを捕捉。逆に Chromium レベルの
メッセージ (リソース読み込み失敗、CORS) は Node 側リスナーにしか出ません。

## 3. システムエラー (Chromium 起動不能、ディスク満杯、OOM)

例外として上に浮上。HTTP サーバーは `500` を JSON ボディ付きで返し、
CLI は非 0 で終了 (メッセージは stderr)。リトライは試みません — Chromium が
繰り返し死ぬなら、systemd やオーケストレータで再起動するのが筋。

## 関連する Chart.js の挙動

Chart.js には意図的に模倣しているポリシーがあります: **おかしなオプション値は
通常警告であり、例外ではない**。ベストエフォートでレンダリングしコンソールに
ログを出します。我々のパイプラインはそれを保ち、「どんな警告でもリクエストを
失敗させたい」場合はクライアント側で処理:

```ts
const resp = await fetch('/render', { method: 'POST', body: ... })
const xChartMessages = resp.headers.get('X-Chart-Messages')
if (xChartMessages) {
  const messages = JSON.parse(xChartMessages)
  if (messages.some(m => m.level === 'error')) {
    throw new Error('Chart errored: ' + messages[0].message)
  }
}
```

## DataError と System error — lightfile6-jpeg からの借り物

兄弟プロジェクトの `lightfile6-jpeg` パッケージは **DataError** (入力データが
悪い — システム障害ではない) とシステムエラー (ディスク、メモリ) を明確に
区別しています。chartjs2img も実質同じことをしていますが暗黙的:
Chart.js がコンソールにエラーを出すのがデータエラーで、自コード内で例外が
出るのがシステムエラー。

chartjs2img が自前 TypeScript SDK を持つときには、境界はおそらく次のように
なります:

- レンダラが起動できない / クラッシュした / タイムアウトしたら `SystemError` を throw。
- レンダリングが完了し Chart.js が何か言ったら `RenderResult { messages: [...] }` を返す。

現状、結果上の「messages」がデータエラーチャネル。チャート設定不良で
例外を投げてはいけません。

## ロギングポリシー

- `console.log` — 起動バナーと情報的な進捗 (1 回きり) のみ。
- `console.warn` — 非常だが想定内 (タイムアウト後の強制ページクローズなど)。
- `console.error` — 想定外失敗 (ブラウザ切断、レンダリング例外)。

リクエスト毎の成功はログしません — 呼び出し元の責任。数万件のレンダリングを
ランタイムログすると単なるノイズ。

## タイムアウト

| タイマー                          | 値                                | 発生時                                                    |
| --------------------------------- | --------------------------------- | --------------------------------------------------------- |
| `page.goto` + `waitForFunction`   | 30 秒 (ハードコード)              | throw; リクエストは `500` / CLI は非 0 終了                |
| `PAGE_TIMEOUT_SECONDS`            | 既定 `60`、環境変数で変更可能     | タブを強制クローズ。進行中レンダラがあれば呼び出し元にも 500/例外が届く |
| ブラウザ起動                      | puppeteer 既定 ~30 秒              | 同上                                                      |

HTTP サーバーには **全体リクエストタイムアウトはありません** — クライアントは
独自のクライアント側タイムアウトを設定すべきです。
