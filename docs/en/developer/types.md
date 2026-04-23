---
title: Types & HTTP schema
description: TypeScript interfaces exposed by chartjs2img and the exact JSON shape expected by the HTTP API.
---

# Types & HTTP schema

If you're integrating chartjs2img from code, these are the exact types
and payloads you'll deal with.

## `RenderOptions` (template.ts)

The canonical "render a chart" input. Used by both the CLI (directly)
and the HTTP server (as the inner shape after unwrapping).

```ts
interface RenderOptions {
  /** Chart.js configuration object */
  chart: Record<string, unknown>
  /** Canvas width in pixels (default: 800) */
  width?: number
  /** Canvas height in pixels (default: 600) */
  height?: number
  /** Device pixel ratio (default: 2) */
  devicePixelRatio?: number
  /** Background color, CSS syntax (default: 'white') */
  backgroundColor?: string
  /** Output format: png, jpeg, webp (default: 'png') */
  format?: 'png' | 'jpeg' | 'webp'
  /** JPEG/WebP quality 0-100 (default: 90) */
  quality?: number
}
```

## `RenderResult` (renderer.ts)

What `renderChart()` returns.

```ts
interface RenderResult {
  /** Image bytes in the requested format */
  buffer: Buffer
  /** SHA-256 prefix (16 hex chars) that keys the cache */
  hash: string
  /** MIME type matching `format` (image/png, image/jpeg, image/webp) */
  contentType: string
  /** true if served from cache, false if freshly rendered */
  cached: boolean
  /** Chart.js console messages captured during render */
  messages: ConsoleMessage[]
}

interface ConsoleMessage {
  level: 'error' | 'warn' | 'info' | 'log'
  message: string
}
```

Only `error` and `warn` actually appear in practice; `info` / `log` are
reserved for future use.

## `ServerConfig` (server.ts)

```ts
interface ServerConfig {
  port: number
  host: string
  apiKey?: string
}
```

## HTTP body — `POST /render`

**Outer** wrapper (server-side) — different from CLI which expects the
chart config directly:

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

`chart` is the only required field. The server validates only its
presence — Chart.js itself validates the rest and reports errors via
`X-Chart-Messages`.

## HTTP query — `GET /render`

Same semantic content, encoded as query params:

```
GET /render?chart=<URL-encoded JSON>
          &width=800
          &height=600
          &devicePixelRatio=2
          &backgroundColor=white
          &format=png
          &quality=90
```

Only `chart` is required; other params are optional. Query params
coerce to `number` where applicable (`width`, `height`, `quality`).

## HTTP response — successful render

```
HTTP/1.1 200 OK
Content-Type: image/png
Content-Length: <N>
X-Cache-Hash: <16 hex chars>
X-Cache-Url: http://host:port/cache/<hash>
X-Cache-Hit: true|false
X-Chart-Messages: [{"level":"error","message":"…"}, …]   ← only when non-empty
X-Powered-By: chartjs2img/<version>

<image bytes>
```

## HTTP response — `/health`

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

## HTTP response — `/cache/:hash`

On hit:

```
HTTP/1.1 200 OK
Content-Type: image/png
Content-Length: <N>
Cache-Control: public, max-age=3600

<image bytes>
```

On miss (expired or never rendered):

```
HTTP/1.1 404 Not Found
Content-Type: application/json

{ "error": "Cache miss - image not found or expired" }
```

## HTTP error responses

| Status                  | Body JSON                                      | When                                                     |
| ----------------------- | ---------------------------------------------- | -------------------------------------------------------- |
| `400 Bad Request`       | `{ "error": "Missing chart parameter" }`       | GET `/render` without `chart=` query                     |
| `401 Unauthorized`      | `{ "error": "Unauthorized" }`                  | `API_KEY` set and request missing/wrong key              |
| `404 Not Found`         | `{ "error": "Not found" }` / cache miss msg    | Unknown path, or cache hash with no entry                |
| `405 Method Not Allowed`| `{ "error": "Method not allowed" }`            | `/render` with method other than GET/POST                |
| `500 Internal Server Error`| `{ "error": "<exception message>" }`        | Unhandled exception inside `handleRequest()`             |

## CLI argument shapes (cli.ts)

```ts
interface CliRenderArgs {
  input?: string           // path, or "-" for stdin, or undefined → stdin
  output?: string          // path, or "-" for stdout, or undefined → stdout
  width?: number
  height?: number
  devicePixelRatio?: number
  backgroundColor?: string
  format?: 'png' | 'jpeg' | 'webp'
  quality?: number
}

interface CliExamplesArgs {
  outdir: string           // required
  format?: 'png' | 'jpeg'
  quality?: number
}
```

The CLI's JSON input (stdin or file) is the **Chart.js config directly** —
no outer `chart` wrapper. That's the one asymmetry between CLI and
HTTP: HTTP wraps, CLI doesn't. See [Adding a Chart.js plugin](./adding-plugin)
for why.
