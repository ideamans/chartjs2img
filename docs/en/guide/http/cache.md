---
title: Cache
description: How chartjs2img's hash-based cache works, how to read X-Cache headers, and how to turn cache hashes into CDN-friendly URLs.
---

# Cache

Every `POST /render` computes a SHA-256 hash of the canonicalized
request (chart config + size + format + options). If the same hash
has been rendered recently, the cached image is returned instantly.

## How the hash is computed

The cache key is deterministic over:

- `chart` (full JSON, canonicalized key order — `{a:1,b:2}` and
  `{b:2,a:1}` hash the same)
- `width`, `height`, `devicePixelRatio`
- `backgroundColor`, `format`, `quality`

Reorder the keys, change whitespace, or swap a float for an
equivalent integer — the hash still matches, because the input is
normalized before hashing. Change a single data point and you'll get
a new hash.

The hash is the first 16 hex chars of the SHA-256 digest. Collision
probability at this length is negligible for a cache layer.

## Headers to watch

Every `/render` response carries:

| Header         | Example                                     | Meaning                      |
| -------------- | ------------------------------------------- | ---------------------------- |
| `X-Cache-Hash` | `6b4cc4e8940fd921`                          | The key for this image       |
| `X-Cache-Url`  | `http://host:3000/cache/6b4cc4e8940fd921`   | Direct URL to re-fetch       |
| `X-Cache-Hit`  | `true` / `false`                            | Served from cache?           |

## CDN-friendly URLs

Because `X-Cache-Url` points at `/cache/:hash` — a plain GET
endpoint — you can hand that URL to a browser, a Markdown document,
or a CDN. Once fetched, most CDNs can cache it indefinitely (entries
are immutable for their hash).

```html
<!-- Rendered once; reused forever -->
<img src="https://charts.example.com/cache/6b4cc4e8940fd921">
```

## Eviction and TTL

| Setting                | Default | Env var              |
| ---------------------- | ------- | -------------------- |
| Max entries in memory  | 1000    | `CACHE_MAX_ENTRIES`  |
| Time-to-live (seconds) | 3600    | `CACHE_TTL_SECONDS`  |

The cache is bounded (FIFO eviction when full) plus per-entry TTL.
Fetching an evicted or expired `/cache/:hash` returns `404`.

## When to rely on the cache

- **Dashboards** that render the same charts repeatedly for many
  viewers.
- **LLM agents** that propose the same configuration multiple times
  during iteration.
- **Snapshot emails / reports** where the chart is computed once at
  publish time and embedded everywhere.

## When NOT to rely on it

- Live data streams where every render has new inputs — the hash will
  always miss.
- Compliance scenarios where each request must physically re-render
  (to prove fresh data). Set `CACHE_MAX_ENTRIES=0` or skip the cache
  by always sending unique inputs.
- Horizontal-scale-out deployments — the cache is per-process, not
  shared. Put a CDN in front to coalesce across instances.

## Smoke test

```bash
# First call — fresh render
curl -s -D- -X POST http://localhost:3000/render \
  -H 'Content-Type: application/json' \
  -d '{"chart":{"type":"bar","data":{"labels":["A","B"],"datasets":[{"data":[1,2]}]}}}' \
  -o /dev/null | grep -i x-cache

# Second call — same body, should be a hit
curl -s -D- -X POST http://localhost:3000/render \
  -H 'Content-Type: application/json' \
  -d '{"chart":{"type":"bar","data":{"labels":["A","B"],"datasets":[{"data":[1,2]}]}}}' \
  -o /dev/null | grep -i x-cache
```

You should see `X-Cache-Hit: false` followed by `X-Cache-Hit: true`.
