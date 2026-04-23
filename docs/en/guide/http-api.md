---
title: HTTP API
description: Every HTTP endpoint exposed by chartjs2img - POST/GET /render, cache retrieval, health, and the built-in examples gallery.
---

# HTTP API

Start the server with `chartjs2img serve` (or `bun run dev`). Defaults:
bind `0.0.0.0`, port `3000`. Endpoints below are mounted at the root.

## `POST /render`

Render a chart from a JSON body.

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

### Request body

| Field              | Type    | Default        | Description                                          |
| ------------------ | ------- | -------------- | ---------------------------------------------------- |
| `chart`            | object  | *required*     | Chart.js config (`type`, `data`, `options`, `plugins`) |
| `width`            | number  | `800`          | Image width in pixels                                |
| `height`           | number  | `600`          | Image height in pixels                               |
| `devicePixelRatio` | number  | `2`            | Retina scaling factor                                |
| `backgroundColor`  | string  | `"white"`      | CSS color (`"transparent"` supported)                |
| `format`           | string  | `"png"`        | `png` / `jpeg` / `webp`                              |
| `quality`          | number  | `90`           | JPEG / WebP quality (0-100)                          |

The `chart` field is a standard Chart.js configuration. See
[Bundled plugins](./plugins) for the 12 plugins (+ core) available.

### Response headers

| Header              | Description                                                      |
| ------------------- | ---------------------------------------------------------------- |
| `Content-Type`      | `image/png`, `image/jpeg`, or `image/webp`                        |
| `X-Cache-Hash`      | SHA-256 hash (first 16 hex chars) of the canonicalized request   |
| `X-Cache-Url`       | Full URL to re-fetch this image from `/cache/<hash>`              |
| `X-Cache-Hit`       | `"true"` if served from cache, `"false"` if freshly rendered      |
| `X-Chart-Messages`  | JSON array of `{level, message}` from Chart.js — only present if errors/warnings occurred |

See [Error feedback](./error-feedback) for how to interpret `X-Chart-Messages`.

## `GET /render`

Same semantics as POST, but all parameters come from query strings.
Useful for embedding in `<img>` tags.

```
GET /render?chart={"type":"bar","data":{...}}&width=400&height=300
```

The `chart` query parameter must be a URL-encoded JSON string.

## `GET /cache/:hash`

Re-fetch a previously rendered image by its cache hash.

```bash
# Render and grab the hash
HASH=$(curl -s -D- -X POST http://localhost:3000/render \
  -H 'Content-Type: application/json' \
  -d '{"chart":{"type":"bar","data":{"labels":["A","B"],"datasets":[{"data":[1,2]}]}}}' \
  -o /dev/null | grep -i x-cache-hash | awk '{print $2}' | tr -d '\r')

# Fetch the cached image later
curl -o chart.png "http://localhost:3000/cache/$HASH"
```

Cached entries expire after `CACHE_TTL_SECONDS` (default 3600s). Missing
or expired hashes return `404`.

## `GET /health`

Returns server status, renderer stats, cache info, and concurrency counters.

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

Useful for liveness / readiness probes.

## `GET /examples`

Built-in gallery showing 18 example charts rendered in real time. The
page displays each chart plus its source JSON — a convenient way to
verify the service is up and browse available chart types.

## Authentication

If `API_KEY` is set, all requests to `/render` and `/cache/:hash` must
include the key. `/health` and `/examples` remain public.

See [Authentication](./auth) for all three methods (`Authorization`,
`X-API-Key`, `?api_key=`).

## Capacity

Incoming renders wait on a semaphore with `CONCURRENCY` slots (default `8`).
Extra requests queue until a slot frees up. Tune via environment
variable — see [Environment variables](./env-vars).
