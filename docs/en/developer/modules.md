---
title: Modules
description: One-line summary of every src/*.ts file in chartjs2img - what it exports and what depends on it.
---

# Modules

Short table of every source module, what it exports, and who imports
it. Use this to figure out where to open the editor.

## `src/index.ts` — CLI entry point

The binary's `main()`. Parses `argv`, prints the usage banner, and
dispatches to one of `serve`, `render`, `examples`, `llm`, `help`, or
`version`. No business logic — just argv → function call.

**Exports**: none (script entry).
**Imports**: `server.ts`, `cli.ts`, `version.ts`, `llm-docs/index.ts`.

## `src/server.ts` — HTTP server

`startServer()` spins up `Bun.serve()` on the configured host + port,
routes requests to `/render`, `/cache/:hash`, `/health`, `/examples`,
or `404`. Handles auth with `checkAuth()`.

**Exports**: `startServer(config)`, `ServerConfig` interface.
**Imports**: `renderer.ts`, `cache.ts`, `examples.ts`, `version.ts`, `template.ts` (type only).

## `src/cli.ts` — CLI `render` + `examples`

- `cliRender()` reads JSON from stdin or a file, calls `renderChart()`,
  writes the image to stdout or a file, and echoes Chart.js messages to
  stderr.
- `cliExamples()` iterates `EXAMPLES`, calls `renderChart()` for each,
  writes `NN-<slug>.{png,jpg}` + `NN-<slug>.json` to `--outdir`.

**Exports**: `cliRender`, `cliExamples`, and their arg interfaces.
**Imports**: `renderer.ts`, `examples.ts`, `template.ts` (type only).

## `src/renderer.ts` — Chromium pipeline

The rendering core. Manages:

- **Chromium discovery & auto-install** — `findChromiumExecutable()`,
  `downloadChromeForTesting()`, `ensureChromiumInstalled()`.
- **Browser lifecycle** — `ensureBrowser()`, `launchBrowser()`,
  `closeBrowser()`. Single module-level `browser` ref; launches
  lazily, auto-clears on `disconnected`.
- **Page lifecycle** — `schedulePageCleanup()` arms a `setTimeout`
  that force-closes the tab after `PAGE_TIMEOUT_SECONDS`.
- **Render entry** — `renderChart()` is the single export the rest of
  the codebase calls. It handles hash compute, cache get/set, semaphore
  acquire/release, HTML build, `page.goto(data:…)`, console capture,
  screenshot.
- **Stats** — `rendererStats()` for `/health`.

**Exports**: `renderChart`, `closeBrowser`, `rendererStats`,
`ConsoleMessage`, `RenderResult`.
**Imports**: `puppeteer-core`, `template.ts`, `semaphore.ts`, `cache.ts`.

## `src/template.ts` — Browser-side HTML

Static HTML string containing every CDN `<script>` for Chart.js + 12
plugins, and an IIFE that:

- registers non-auto-registering plugins (datalabels, chartjs-chart-geo);
- forces animations OFF;
- wraps `console.warn` / `console.error` into `window.__chartMessages`;
- instantiates `Chart` inside try/catch;
- sets `window.__chartRendered = true` when done.

Edit this file if you add/remove/upgrade a plugin. See
[Adding a Chart.js plugin](./adding-plugin).

**Exports**: `buildHtml(options)`, `RenderOptions` interface, `LIBS` const.
**Imports**: none.

## `src/cache.ts` — In-memory cache

`Map<string, CacheEntry>` with LRU-ish eviction (oldest key evicted
when `size >= MAX_ENTRIES`) and TTL (lazy expiry on `getCache`).
`computeHash()` hashes `{chart, width, height, devicePixelRatio,
backgroundColor, format, quality}` via SHA-256 and takes the first 16
hex chars.

**Exports**: `computeHash`, `getCache`, `setCache`, `cacheStats`.
**Imports**: `crypto` (Node built-in), `template.ts` (type only).

## `src/semaphore.ts` — Concurrency control

30-line async semaphore. `acquire()` returns immediately if under
capacity, otherwise pushes a resolver into a FIFO queue. `release()`
pops the head of the queue and resolves.

**Exports**: `Semaphore` class.
**Imports**: none.

## `src/examples.ts` — Built-in examples

`EXAMPLES` is an array of `{ title, config, width?, height? }` used
by:

- The CLI's `examples` subcommand (writes PNG + JSON files)
- The HTTP `/examples` gallery (embeds `<img src="/render?chart=…">` tags)

Add new examples here; they show up in both the CLI output directory
and the gallery page automatically.

**Exports**: `EXAMPLES`, `buildExamplesHtml()`.
**Imports**: none.

## `src/version.ts` — Version constant

Single-line module re-exporting `VERSION` from `package.json` (via
Bun's `await import(..., { type: 'json' })`, so compile-time inlined
by `bun build`).

**Exports**: `VERSION`.
**Imports**: `package.json`.

## `src/llm-docs/` — LLM reference bundle

One TS file per Chart.js module. Each file exports `doc: string` — a
multi-line Markdown snippet. `llm-docs/index.ts` aggregates them into
`getLlmDocs()` which `chartjs2img llm` prints.

See [Adding LLM docs](./adding-llm-doc).

### The files

| Module file                  | Covers                                                       |
| ---------------------------- | ------------------------------------------------------------ |
| `usage.ts`                   | How to invoke chartjs2img; JSON vs HTTP distinction          |
| `chartjs-core.ts`            | Chart.js core: types, datasets, scales, title/legend/tooltip |
| `plugin-datalabels.ts`       | chartjs-plugin-datalabels options                            |
| `plugin-annotation.ts`       | chartjs-plugin-annotation options                            |
| `plugin-zoom.ts`             | chartjs-plugin-zoom options                                  |
| `plugin-gradient.ts`         | chartjs-plugin-gradient options                              |
| `chart-matrix.ts`            | matrix / heatmap chart type                                  |
| `chart-sankey.ts`            | sankey chart type                                            |
| `chart-treemap.ts`           | treemap chart type                                           |
| `chart-wordcloud.ts`         | wordcloud chart type                                         |
| `chart-geo.ts`               | choropleth + bubbleMap chart types                           |
| `chart-graph.ts`             | graph / forceDirectedGraph / dendrogram / tree chart types   |
| `chart-venn.ts`              | venn + euler chart types                                     |
| `adapter-dayjs.ts`           | dayjs date adapter for time-series axes                      |

## Dependency graph (roughly)

```
      index.ts
      /     \
  server.ts  cli.ts
      \     /       \
      renderer.ts    examples.ts
         │
         ├── template.ts
         ├── cache.ts
         └── semaphore.ts

  llm-docs/index.ts ─── llm-docs/<many>.ts
          │
      chartjs2img llm (via index.ts → getLlmDocs)
```

No cyclic deps. Nothing imports `server.ts` or `cli.ts` except
`index.ts` — keeping entry points thin.
