---
title: Developer Guide
description: Orientation for contributors - repo layout, where to start reading, and how to extend chartjs2img.
---

# Developer Guide

You've cloned the repo and want to understand or extend chartjs2img.
This page points you to the right spot for each kind of change.

## What this project is

A thin service around **Chart.js rendered inside headless Chromium**:

```
          ┌─────────────────────────────────────────┐
          │     chartjs2img  (Bun + TypeScript)     │
          │                                         │
          │   CLI  ─┐       ┌─  HTTP Server         │
          │        ├── renderer.ts ──────┐          │
          │        │                     │          │
          │        │  semaphore + cache  │          │
          │        │                     │          │
          │        └── puppeteer-core ───┘          │
          │                    │                    │
          │                    ▼                    │
          │            Headless Chromium             │
          │            (Chart.js + 12 plugins)       │
          └─────────────────────────────────────────┘
```

Everything on the Node side is written so it can run unchanged under
`bun --compile` — there's no build step required for development.

## Repo layout

```
chartjs2img/
├── src/
│   ├── index.ts         # CLI entry point: argv parser, subcommand dispatch
│   ├── cli.ts           # `render` + `examples` CLI implementations
│   ├── server.ts        # `serve` HTTP server (Bun.serve)
│   ├── renderer.ts      # Puppeteer + Chromium lifecycle, screenshot pipeline
│   ├── template.ts      # Static HTML template loaded in the browser
│   ├── cache.ts         # In-memory LRU + TTL cache
│   ├── semaphore.ts     # Tiny async semaphore for concurrency control
│   ├── examples.ts      # Built-in chart examples (used by CLI + gallery)
│   ├── version.ts       # Single source of truth for VERSION
│   └── llm-docs/        # Per-module LLM-oriented Markdown snippets
│       ├── index.ts     # Aggregates + exports getLlmDocs()
│       ├── usage.ts
│       ├── chartjs-core.ts
│       ├── plugin-*.ts
│       ├── chart-*.ts
│       └── adapter-*.ts
├── examples/            # JSON inputs + PNG outputs (regenerable)
├── docs/                # VitePress bilingual documentation site
├── .github/workflows/   # CI
├── Dockerfile
├── package.json
└── README.md
```

The code base is intentionally small (~2000 LOC excluding llm-docs) —
all the heavy lifting happens inside Chromium. When you're reading, the
interesting file is usually `renderer.ts`.

## Common contribution flows

### "I want to add another Chart.js plugin"

See [Adding a Chart.js plugin](./adding-plugin).

### "I want to document a plugin for LLMs"

See [Adding LLM docs](./adding-llm-doc).

### "I want to tune concurrency / cache / browser behavior"

See [Architecture](./architecture) for the moving parts, then check
[Modules](./modules) for which file to edit. Most knobs are env vars —
no rebuild needed.

### "I hit a bug in rendering"

Check the browser console first. In `renderer.ts`, `page.on('console',
…)` and `window.__chartMessages` capture both Chromium-side and
Chart.js-side errors. They surface to the caller via `X-Chart-Messages`
(HTTP) or stderr (CLI) — see [Error handling](./error-handling).

## Running from source

```bash
bun install
bun run dev              # HTTP server on :3000
bun run cli -- help      # CLI help
bun run cli -- llm       # LLM reference output
```

`bun run` prepends the project's local binaries and doesn't need a
compiled binary. Type check with `bun run typecheck`.

## Running the full site locally

```bash
bun run docs:dev         # VitePress dev server on :5173
```

The docs site has no backend. It reads `docs/en/**` and `docs/ja/**`,
plus the sidebar/nav defined in `docs/.vitepress/config.ts`.

## Where to go next

- **[Library API (TypeScript)](./library-api)** — import `renderChart` and friends from any Bun / Node program.
- **[Architecture](./architecture)** — request flow from HTTP to PNG.
- **[Modules](./modules)** — one-line summary of each `src/*.ts` file.
- **[Types & HTTP schema](./types)** — every interface and every HTTP body.
- **[Adding a Chart.js plugin](./adding-plugin)** — 3-file change, <10 lines.
- **[Adding LLM docs](./adding-llm-doc)** — add a plugin's option table to `chartjs2img llm`.
- **[Error handling](./error-handling)** — how renderer errors / Chart.js errors / server errors differ.
