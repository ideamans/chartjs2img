---
title: HTTP API
description: chartjs2img が公開する HTTP エンドポイント一覧 - POST/GET /render、キャッシュ取得、ヘルスチェック、組み込みサンプルギャラリー。
---

# HTTP API

`chartjs2img serve` (または `bun run dev`) でサーバーを起動します。
既定では `0.0.0.0:3000` にバインドされ、下記のエンドポイントがルートに
マウントされます。

## `POST /render`

JSON ボディからチャートをレンダリング。

```bash
curl -X POST http://localhost:3000/render \
  -H 'Content-Type: application/json' \
  -d '{
    "chart": {
      "type": "bar",
      "data": { "labels": ["1月","2月"], "datasets": [{"data":[1,2]}] }
    },
    "width": 800,
    "height": 600,
    "format": "png"
  }' \
  -o chart.png
```

### リクエストボディ

| フィールド            | 型      | 既定値       | 説明                                                 |
| --------------------- | ------- | ------------ | ---------------------------------------------------- |
| `chart`               | object  | *必須*       | Chart.js 設定 (`type`, `data`, `options`, `plugins`) |
| `width`               | number  | `800`        | 画像幅 (ピクセル)                                    |
| `height`              | number  | `600`        | 画像高さ (ピクセル)                                  |
| `devicePixelRatio`    | number  | `2`          | Retina スケール係数                                  |
| `backgroundColor`     | string  | `"white"`    | CSS カラー (`"transparent"` 対応)                     |
| `format`              | string  | `"png"`      | `png` / `jpeg` / `webp`                              |
| `quality`             | number  | `90`         | JPEG / WebP 品質 (0-100)                             |

`chart` は標準的な Chart.js 設定です。利用できるプラグイン 12 本 + コアは
[同梱プラグイン](./plugins) を参照。

### レスポンスヘッダー

| ヘッダー            | 説明                                                             |
| ------------------- | ---------------------------------------------------------------- |
| `Content-Type`      | `image/png`、`image/jpeg`、または `image/webp`                    |
| `X-Cache-Hash`      | 正規化済みリクエストの SHA-256 先頭 16 文字                       |
| `X-Cache-Url`       | `/cache/<hash>` から再取得するための完全 URL                      |
| `X-Cache-Hit`       | キャッシュから配信なら `"true"`、新規レンダーなら `"false"`       |
| `X-Chart-Messages`  | Chart.js が出した `{level, message}` の JSON 配列 — エラー/警告発生時のみ |

`X-Chart-Messages` の解釈は [エラーフィードバック](./error-feedback) を参照。

## `GET /render`

POST と同じセマンティクス。パラメーターを全て URL クエリで渡します。
`<img>` タグに埋め込むときに便利。

```
GET /render?chart={"type":"bar","data":{...}}&width=400&height=300
```

`chart` クエリは URL エンコードされた JSON 文字列。

## `GET /cache/:hash`

以前レンダリングした画像を、キャッシュハッシュで再取得。

```bash
# レンダーしてハッシュを取り出す
HASH=$(curl -s -D- -X POST http://localhost:3000/render \
  -H 'Content-Type: application/json' \
  -d '{"chart":{"type":"bar","data":{"labels":["A","B"],"datasets":[{"data":[1,2]}]}}}' \
  -o /dev/null | grep -i x-cache-hash | awk '{print $2}' | tr -d '\r')

# 後で取り出す
curl -o chart.png "http://localhost:3000/cache/$HASH"
```

キャッシュエントリは `CACHE_TTL_SECONDS` (既定 3600 秒) で失効します。
存在しない or 失効した hash は `404` を返します。

## `GET /health`

サーバーステータス、レンダラ統計、キャッシュ情報、同時実行カウンターを JSON で返します。

```json
{
  "status": "ok",
  "renderer": {
    "browserConnected": true,
    "concurrency": { "max": 8, "active": 2, "pending": 0 },
    "activePages": 2,
    "pageTimeoutSeconds": 60
  },
  "cache": {
    "size": 42,
    "maxEntries": 1000,
    "ttlSeconds": 3600
  }
}
```

liveness / readiness プローブに使えます。

## `GET /examples`

18 個のサンプルチャートをリアルタイムで表示する組み込みギャラリー。
各チャートと元の JSON を並べて見られるので、サービスの疎通確認や
チャートタイプの参考に便利。

## 認証

`API_KEY` が設定されていれば、`/render` と `/cache/:hash` は全てキーを
必要とします。`/health` と `/examples` は常に公開されます。

3 通りの渡し方 (`Authorization`, `X-API-Key`, `?api_key=`) は
[認証](./auth) を参照。

## キャパシティ

着信レンダリングはスロット数 `CONCURRENCY` (既定 `8`) のセマフォで
キューイングされます。超過分はスロットが空くまで待機します。
詳細は [環境変数](./env-vars) を参照。
