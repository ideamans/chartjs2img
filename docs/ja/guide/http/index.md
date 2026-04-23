---
title: HTTP サーバー
description: chartjs2img を HTTP サービスとして起動 — エンドポイント、リクエスト／レスポンス形式、キャッシュハッシュヘッダ、ヘルスチェック。
---

# HTTP サーバー

`chartjs2img serve` で同じレンダラーを HTTP 経由に公開します。
複数クライアントがチャートを描画する、レンダリングのキャッシュ
共有が効く、サブプロセス起動コストを回避して長期稼働させたい、
といったユースケースで有効です。

```bash
chartjs2img serve --port 3000
```

起動時の表示例:

```
chartjs2img v0.2.2 listening on http://0.0.0.0:3000
  POST /render      - render chart from JSON body
  GET  /render      - render chart from query params
  GET  /cache/:hash - retrieve cached image
  GET  /examples    - examples gallery
  GET  /health      - health check + stats
```

`Ctrl-C`（または `SIGTERM`）でクリーンに停止します。インフライトの
リクエストを待ってから Chromium を閉じます。

## サーバーフラグ

| フラグ       | 既定値     | 環境変数 | 説明                                         |
| ------------ | ---------- | -------- | -------------------------------------------- |
| `--port, -p` | `3000`     | `PORT`   | TCP 待ち受けポート                           |
| `--host`     | `0.0.0.0`  | `HOST`   | バインドアドレス                             |
| `--api-key`  | *(なし)*   | `API_KEY` | 認証有効エンドポイントで要求するトークン   |

並行度、キャッシュ、タイムアウト等は環境変数で設定します。
[環境変数](./env-vars) を参照。

## `POST /render`

JSON ボディからチャートをレンダリング。

```bash
curl -X POST http://localhost:3000/render \
  -H 'Content-Type: application/json' \
  -d '{
    "chart": {
      "type": "bar",
      "data": { "labels": ["Jan","Feb"], "datasets": [{"data":[1,2]}] }
    },
    "width": 800,
    "height": 600,
    "format": "png"
  }' \
  -o chart.png
```

### リクエストボディ

| フィールド         | 型       | 既定値         | 説明                                                 |
| ------------------ | -------- | -------------- | ---------------------------------------------------- |
| `chart`            | object   | **必須**       | Chart.js 設定（`type`、`data`、`options` …）         |
| `width`            | number   | `800`          | 画像幅（ピクセル）                                   |
| `height`           | number   | `600`          | 画像高さ（ピクセル）                                 |
| `devicePixelRatio` | number   | `2`            | Retina スケール係数                                  |
| `backgroundColor`  | string   | `"white"`      | CSS カラー（`"transparent"` 可）                      |
| `format`           | string   | `"png"`        | `png` または `jpeg`                                   |
| `quality`          | number   | `90`           | JPEG 品質 (0-100)                                     |

::: warning JSON のみ — 関数値は静かに破棄されます
`chart` フィールドはヘッドレスブラウザへ渡る際に
`JSON.stringify` を通過します。`formatter: (ctx) => ...` 等の
コールバック、tooltip コールバック、scale tick コールバックは
ここで消えます。静的な値を使ってください。
:::

入力不備は `400` と JSON エラーボディを返します。

```json
{ "error": "Missing or invalid required field: chart (must be an object)" }
```

### レスポンスヘッダ

| ヘッダ              | 説明                                                              |
| ------------------- | ----------------------------------------------------------------- |
| `Content-Type`      | `image/png` または `image/jpeg`                                   |
| `X-Cache-Hash`      | 正規化したリクエストの SHA-256 先頭 16 hex                         |
| `X-Cache-Url`       | `/cache/<hash>` 経由で再取得するための完全 URL                    |
| `X-Cache-Hit`       | キャッシュから返した場合は `"true"`、新規生成なら `"false"`        |
| `X-Chart-Messages`  | Chart.js の警告・エラー `{level, message}` の JSON 配列（ある場合のみ）|

`X-Chart-Messages` の読み方は
[エラーフィードバック](./error-feedback)、ハッシュ計算方法は
[キャッシュ](./cache) を参照。

## `GET /render`

POST と同じ意味論ですが、全パラメータをクエリストリングで渡し
ます。`<img>` タグに埋め込むときに便利です。

```
GET /render?chart={"type":"bar","data":{...}}&width=400&height=300
```

`chart` クエリは URL エンコードした JSON 文字列です。データ点が
数百を超えるなら POST を推奨します。多くのクライアントは URL 長を
サーバー制限より短く切り上げるためです。

## `GET /cache/:hash`

過去のレンダリング結果をキャッシュハッシュで再取得します。

```bash
# レンダリングしてハッシュを取得
HASH=$(curl -s -D- -X POST http://localhost:3000/render \
  -H 'Content-Type: application/json' \
  -d '{"chart":{"type":"bar","data":{"labels":["A","B"],"datasets":[{"data":[1,2]}]}}}' \
  -o /dev/null | grep -i x-cache-hash | awk '{print $2}' | tr -d '\r')

# 後で再取得
curl -o chart.png "http://localhost:3000/cache/$HASH"
```

キャッシュエントリは `CACHE_TTL_SECONDS`（既定 3600）で失効します。
存在しない／失効したハッシュは `404` を返します。詳細は
[キャッシュ](./cache) を参照。

## `GET /health`

サーバーステータス、レンダラー統計、キャッシュ情報、並行度カウンタ
を返します。Liveness / readiness probe に便利です。

```json
{
  "status": "ok",
  "version": "0.2.2",
  "renderer": {
    "browserConnected": true,
    "concurrency": { "max": 8, "active": 2, "pending": 0 },
    "activePages": 2,
    "maxRenderTimeSeconds": 30,
    "pageSafetyNetSeconds": 70,
    "pageTimeoutSeconds": 70
  },
  "cache": {
    "size": 42,
    "maxEntries": 1000,
    "ttlSeconds": 3600
  }
}
```

`pageTimeoutSeconds` は `pageSafetyNetSeconds` のエイリアス
（旧フィールド名互換目的、非推奨）です。

## `GET /examples`

組み込みのサンプルギャラリー。全チャートをその場でレンダリング
して表示します。各チャートの設定 JSON も確認でき、サービスの
動作確認や、利用できるチャート種類を眺める用途に便利です。

::: tip
`API_KEY` 設定時は `/examples` も鍵が必要です（ページが後続の
`/render` 呼び出し用に鍵を埋め込むため、未認証アクセスを許すと
鍵が漏洩するためです）。[認証](./auth) を参照。
:::

## キャパシティ

並行実行は `CONCURRENCY` 個（既定 `8`）のセマフォで制限されます。
超過分はキューイングされます。調整は
[環境変数](./env-vars) を参照。

## 次はどこへ

- **[キャッシュ](./cache)** — ハッシュベースのキャッシュ機構と
  CDN フレンドリーな URL 戦略。
- **[認証](./auth)** — 任意の API キー設定。
- **[Docker](./docker)** — コンテナイメージ、docker-compose、リバースプロキシ。
- **[環境変数](./env-vars)** — サーバー向け全設定。
- **[エラーフィードバック](./error-feedback)** — `X-Chart-Messages` と
  HTTP ステータスコード。
