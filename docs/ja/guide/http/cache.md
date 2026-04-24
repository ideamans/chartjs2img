---
title: キャッシュ
description: chartjs2img のハッシュベースキャッシュの仕組み、X-Cache ヘッダの読み方、キャッシュハッシュを CDN フレンドリーな URL に変換する方法。
---

# キャッシュ

`POST /render` は毎回、正規化したリクエスト（chart 設定 + サイズ +
フォーマット + オプション）の SHA-256 を計算します。同じハッシュが
最近レンダリングされていれば、キャッシュされた画像を即返します。

## ハッシュの計算方法

キャッシュキーは以下から決定的に求めます:

- `chart` — 正規化したキー順での全 JSON（`{a:1,b:2}` と `{b:2,a:1}`
  は同じハッシュになります）
- `width`、`height`、`devicePixelRatio`
- `backgroundColor`、`format`、`quality`

キー順、空白、同値の int/float 表現が変わっても、ハッシュは一致
します（ハッシュ前に正規化するため）。データ点が 1 つ変われば
新しいハッシュが得られます。

ハッシュは SHA-256 ダイジェストの先頭 16 hex 文字です。キャッシュ
層としては衝突確率は無視できる水準です。

## 見るべきヘッダ

`/render` のレスポンスには毎回以下が付与されます。

| ヘッダ          | 例                                         | 意味                             |
| --------------- | ------------------------------------------ | -------------------------------- |
| `X-Cache-Hash`  | `6b4cc4e8940fd921`                         | この画像のキー                   |
| `X-Cache-Url`   | `http://host:3000/cache/6b4cc4e8940fd921`  | 再取得用の直接 URL               |
| `X-Cache-Hit`   | `true` / `false`                           | キャッシュヒットしたか           |

## CDN フレンドリーな URL

`X-Cache-Url` は `/cache/:hash` を指す通常の GET エンドポイント
なので、そのままブラウザ、Markdown ドキュメント、CDN に渡せます。
一度取得したエントリはハッシュに対して不変なので、ほとんどの CDN
で無期限にキャッシュできます。

```html
<!-- 1 度だけレンダリングし、以後は永続的に再利用 -->
<img src="https://charts.example.com/cache/6b4cc4e8940fd921">
```

## 追い出しと TTL

| 設定                     | 既定値 | 環境変数             |
| ------------------------ | ------ | -------------------- |
| メモリ内エントリ上限     | 1000   | `CACHE_MAX_ENTRIES`  |
| TTL（秒）                | 3600   | `CACHE_TTL_SECONDS`  |

容量上限に達すると FIFO で追い出し、エントリ毎に TTL も適用されます。
追い出されたり期限切れのハッシュは `/cache/:hash` に `404` を返します。

## キャッシュが有効な場面

- 同じチャートが多人数に何度も表示される **ダッシュボード**。
- 同じ設定を繰り返し提案する **LLM エージェント** の反復開発。
- 発行時に一度計算されて各所に埋め込まれる **スナップショット**
  メール・レポート。

## 有効でない場面

- 毎回入力が変わるライブデータ — 常にキャッシュミス。
- リクエスト毎に物理的に再描画が必要なコンプライアンス要件。
  `CACHE_MAX_ENTRIES=0` にするか、常にユニークな入力を送るか。
- 水平スケールアウト構成 — キャッシュはプロセスごとのため共有
  されません。CDN を前段に置いてインスタンス間で統合してください。

## スモークテスト

```bash
# 1 回目 — 新規レンダリング
curl -s -D- -X POST http://localhost:3000/render \
  -H 'Content-Type: application/json' \
  -d '{"chart":{"type":"bar","data":{"labels":["A","B"],"datasets":[{"data":[1,2]}]}}}' \
  -o /dev/null | grep -i x-cache

# 2 回目 — 同じボディ、ヒットするはず
curl -s -D- -X POST http://localhost:3000/render \
  -H 'Content-Type: application/json' \
  -d '{"chart":{"type":"bar","data":{"labels":["A","B"],"datasets":[{"data":[1,2]}]}}}' \
  -o /dev/null | grep -i x-cache
```

`X-Cache-Hit: false` の次に `X-Cache-Hit: true` が出れば成功です。
