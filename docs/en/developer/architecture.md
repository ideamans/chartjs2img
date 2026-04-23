---
title: Architecture
description: Request flow from HTTP intake to PNG output in chartjs2img, covering auth, cache, semaphore, browser lifecycle, and page cleanup.
---

# Architecture

The single request path — HTTP intake → cached or fresh render → image
back — is where most of the interesting logic lives.

## Full flow

```
  POST /render (or GET /render, or CLI render)
       │
       ▼
  ┌───────────┐
  │   Auth    │   server.ts::checkAuth
  │   check   │   → 401 if API_KEY set and missing/wrong
  └───────────┘
       │ ok
       ▼
  ┌───────────┐
  │  Compute  │   cache.ts::computeHash
  │   hash    │   → SHA-256(canonical(request)) [0:16]
  └───────────┘
       │
       ▼
  ┌───────────┐
  │  Cache    │   cache.ts::getCache
  │  lookup   │   → hit? return image with X-Cache-Hit: true
  └───────────┘
       │ miss
       ▼
  ┌───────────┐
  │ Semaphore │   semaphore.ts::acquire
  │  acquire  │   → waits if active == CONCURRENCY (default 8)
  └───────────┘
       │
       ▼
  ┌───────────┐
  │ Double-   │   cache.ts::getCache (again)
  │ check     │   → racing request may have finished while we waited
  │ cache     │
  └───────────┘
       │ still miss
       ▼
  ┌───────────┐
  │  Ensure   │   renderer.ts::ensureBrowser
  │  browser  │   → launches puppeteer if not already running
  └───────────┘
       │
       ▼
  ┌───────────┐
  │  New page │   b.newPage() + schedulePageCleanup
  │  (tab)    │   → setTimeout force-close after PAGE_TIMEOUT_SECONDS
  └───────────┘
       │
       ▼
  ┌───────────┐
  │  Render   │   template.ts::buildHtml + page.goto(dataUrl)
  │  chart    │   → wait for window.__chartRendered === true
  │           │   → collect window.__chartMessages
  └───────────┘
       │
       ▼
  ┌───────────┐
  │ Screenshot│   container.screenshot({ type, quality })
  │           │   → Buffer with PNG/JPEG bytes
  └───────────┘
       │
       ▼
  ┌───────────┐
  │  Store    │   cache.ts::setCache
  │  in cache │   → evicts oldest if at MAX_ENTRIES
  └───────────┘
       │
       ▼
  ┌───────────┐
  │  Close    │   clearPageCleanup + page.close()
  │  page     │
  └───────────┘
       │
       ▼
  ┌───────────┐
  │ Release   │   semaphore.ts::release
  │ semaphore │   → wakes next queued render, if any
  └───────────┘
       │
       ▼
  Response: image + X-Cache-* headers + X-Chart-Messages (if any)
```

## Key design choices

### The cache is deliberately coarse

`computeHash` canonicalizes by JSON-stringifying a stable object shape
— `{chart, width, height, devicePixelRatio, backgroundColor, format, quality}`.
That means:

- Different key ordering in `chart` **does not** affect the hash
  (JSON.stringify doesn't sort keys, but the caller submitting the
  same logical JSON object will almost always serialize it the same
  way; in practice this is good enough).
- Any change in dataset values, however small, produces a different
  hash.

For pathological hash churn, disable the cache (`CACHE_MAX_ENTRIES=0`).

### The semaphore is independent of the cache

A cache hit **does not** acquire the semaphore — we return the cached
buffer immediately. This keeps repeated identical requests from
consuming browser tabs.

### One browser, many pages

`browser` is a module-level singleton. Each render gets its own tab
(`b.newPage()`). On `browser.on('disconnected')` we null the reference
so the next request re-launches. Tabs are time-bound: if a render
exceeds `PAGE_TIMEOUT_SECONDS`, the cleanup timer force-closes the tab
— no orphaned-page leak on hung renders.

### Chromium runs with `--no-sandbox`

Required for running as root inside Docker (without it, Chromium
refuses to start). If you're running chartjs2img outside a container
as root, you already have bigger problems.

### The HTML template is static

`template.ts::buildHtml` produces a single HTML document containing
every plugin's CDN `<script>` tag, inline CSS, and an IIFE that:

1. Registers plugins that don't auto-register (datalabels, chartjs-chart-geo).
2. Forces animations OFF (so `page.screenshot` captures a stable frame).
3. Wraps `console.warn` / `console.error` to push into `window.__chartMessages`.
4. Creates the `Chart` instance inside try/catch; stores errors on `window.__chartError`.
5. Sets `window.__chartRendered = true` so the renderer knows to screenshot.

This template is what makes "render any Chart.js config" tractable — a
single page init covers every chart type and every plugin we bundle.

### Plugins are CDN-loaded at page init

We do **not** bundle Chart.js plugins into the Node-side JavaScript.
They're fetched from jsdelivr inside Chromium on every page load. That
has two implications:

- First render after a browser cold-start is slower (network round-trips).
- Offline operation requires a local mirror (nginx serving the same
  paths, or Puppeteer's request interception pointing at a cache dir).

Upside: upgrading a plugin is a one-line change in
[template.ts](./modules#template-ts) with no rebuild.

## What isn't in the flow

- **No database.** The cache is in-memory; restarts lose it.
- **No authentication state.** Every request carries the key or doesn't.
- **No WebSocket / SSE.** Just HTTP 1.1 request/response.
- **No multi-process rendering.** Scale horizontally by running multiple instances behind a load balancer. The cache isn't shared between instances (by design — a CDN is the right layer for that).

## Concurrency tuning knobs

| Env var                  | Default | What changes                                                     |
| ------------------------ | ------- | ---------------------------------------------------------------- |
| `CONCURRENCY`            | `8`     | Max semaphore slots — i.e., simultaneous browser tabs             |
| `PAGE_TIMEOUT_SECONDS`   | `60`    | How long a single render can run before the tab is force-killed  |
| `CACHE_MAX_ENTRIES`      | `1000`  | LRU capacity                                                      |
| `CACHE_TTL_SECONDS`      | `3600`  | Per-entry TTL                                                     |

See [Env vars](../guide/env-vars) for the user-facing doc.
