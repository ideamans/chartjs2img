---
title: 型と HTTP スキーマ
description: chartjs2img が公開する TypeScript インターフェースと、HTTP API が期待する JSON 形状。
---

# 型と HTTP スキーマ

コードから chartjs2img を統合する場合、扱うのはここに列挙された型と
ペイロードです。

## `RenderOptions` (template.ts)

正規の「チャートをレンダリングする」入力。CLI (直接) と HTTP サーバー
(ラップ解除後の内側の形状) の両方で使用。

```ts
interface RenderOptions {
  /** Chart.js 設定オブジェクト */
  chart: Record<string, unknown>
  /** キャンバス幅 (ピクセル、既定 800) */
  width?: number
  /** キャンバス高さ (ピクセル、既定 600) */
  height?: number
  /** デバイスピクセル比 (既定 2) */
  devicePixelRatio?: number
  /** 背景色、CSS 構文 (既定 'white') */
  backgroundColor?: string
  /** 出力形式: png, jpeg, webp (既定 'png') */
  format?: 'png' | 'jpeg' | 'webp'
  /** JPEG / WebP 品質 0-100 (既定 90) */
  quality?: number
}
```

## `RenderResult` (renderer.ts)

`renderChart()` の返却値。

```ts
interface RenderResult {
  /** 指定形式の画像バイト */
  buffer: Buffer
  /** キャッシュキーとなる SHA-256 先頭 16 桁 (hex) */
  hash: string
  /** `format` に対応する MIME タイプ (image/png, image/jpeg, image/webp) */
  contentType: string
  /** キャッシュから配信なら true、新規レンダリングなら false */
  cached: boolean
  /** レンダリング中に捕捉した Chart.js コンソールメッセージ */
  messages: ConsoleMessage[]
}

interface ConsoleMessage {
  level: 'error' | 'warn' | 'info' | 'log'
  message: string
}
```

実運用で実際に現れるのは `error` と `warn` のみ。`info` / `log` は将来用に予約。

## `ServerConfig` (server.ts)

```ts
interface ServerConfig {
  port: number
  host: string
  apiKey?: string
}
```

## HTTP ボディ — `POST /render`

**外側** ラッパー (サーバー側) — CLI とは異なり、CLI はチャート設定を
直接期待します:

```jsonc
{
  "chart": { /* RenderOptions.chart */ },
  "width": 800,
  "height": 600,
  "devicePixelRatio": 2,
  "backgroundColor": "white",
  "format": "png",
  "quality": 90
}
```

必須フィールドは `chart` のみ。サーバーは存在チェックのみ行い、その他は
Chart.js 自身が検証して `X-Chart-Messages` でエラーを返します。

## HTTP クエリ — `GET /render`

同じ意味内容をクエリパラメータとしてエンコード:

```
GET /render?chart=<URL エンコードされた JSON>
          &width=800
          &height=600
          &devicePixelRatio=2
          &backgroundColor=white
          &format=png
          &quality=90
```

必須は `chart` のみ。他は任意。該当するものはクエリで `number` にコーセ
(`width`, `height`, `quality`)。

## HTTP レスポンス — レンダリング成功

```
HTTP/1.1 200 OK
Content-Type: image/png
Content-Length: <N>
X-Cache-Hash: <16 桁 hex>
X-Cache-Url: http://host:port/cache/<hash>
X-Cache-Hit: true|false
X-Chart-Messages: [{"level":"error","message":"…"}, …]   ← 非空のときのみ
X-Powered-By: chartjs2img/<version>

<画像バイト>
```

## HTTP レスポンス — `/health`

```ts
type HealthResponse = {
  status: 'ok'
  version: string
  renderer: {
    browserConnected: boolean
    concurrency: { max: number; active: number; pending: number }
    activePages: number
    pageTimeoutSeconds: number
  }
  cache: {
    size: number
    maxEntries: number
    ttlSeconds: number
  }
}
```

## HTTP レスポンス — `/cache/:hash`

ヒット時:

```
HTTP/1.1 200 OK
Content-Type: image/png
Content-Length: <N>
Cache-Control: public, max-age=3600

<画像バイト>
```

ミス時 (期限切れまたは未レンダリング):

```
HTTP/1.1 404 Not Found
Content-Type: application/json

{ "error": "Cache miss - image not found or expired" }
```

## HTTP エラーレスポンス

| ステータス                  | ボディ JSON                                      | 発生ケース                                              |
| --------------------------- | ------------------------------------------------ | ------------------------------------------------------- |
| `400 Bad Request`           | `{ "error": "Missing chart parameter" }`         | GET `/render` で `chart=` クエリがない                  |
| `401 Unauthorized`          | `{ "error": "Unauthorized" }`                    | `API_KEY` が設定され、リクエストのキーが無い/不一致     |
| `404 Not Found`             | `{ "error": "Not found" }` / キャッシュミスメッセージ | 未知のパス、またはキャッシュハッシュが存在しない      |
| `405 Method Not Allowed`    | `{ "error": "Method not allowed" }`              | `/render` に GET/POST 以外のメソッド                    |
| `500 Internal Server Error` | `{ "error": "<例外メッセージ>" }`                 | `handleRequest()` 内の未処理例外                         |

## CLI 引数型 (cli.ts)

```ts
interface CliRenderArgs {
  input?: string           // パス、`-` で stdin 明示、undefined なら stdin
  output?: string          // パス、`-` で stdout 明示、undefined なら stdout
  width?: number
  height?: number
  devicePixelRatio?: number
  backgroundColor?: string
  format?: 'png' | 'jpeg' | 'webp'
  quality?: number
}

interface CliExamplesArgs {
  outdir: string           // 必須
  format?: 'png' | 'jpeg'
  quality?: number
}
```

CLI の JSON 入力 (stdin またはファイル) は **Chart.js 設定そのもの** —
外側の `chart` ラッパーはなし。これが CLI と HTTP 間の唯一の非対称:
HTTP はラップ、CLI はラップしない。理由は [Chart.js プラグインの追加](./adding-plugin)
を参照。
