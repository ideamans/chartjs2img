---
title: Quick start
description: Render your first Chart.js chart to PNG in under a minute using chartjs2img's CLI and HTTP API.
---

# Quick start

Render a Chart.js chart to a PNG in under a minute. chartjs2img takes a
Chart.js configuration JSON and spits out an image, using headless
Chromium under the hood.

You can talk to it two ways:

- **HTTP API** — POST JSON, get an image back. Best for long-running services.
- **CLI** — pipe JSON in, get an image out. Best for one-shot renders.

Both share the same renderer, cache, and plugin bundle.

## Prerequisites

You need [Bun](https://bun.sh) installed.

```bash
# macOS / Linux
curl -fsSL https://bun.sh/install | bash

# then restart your shell or source your rc file
source ~/.zshrc   # or ~/.bashrc
```

Verify:

```bash
bun --version
```

On the first render, Chromium is **auto-downloaded** to your user cache
(~250 MB). On linux-arm64, auto-download isn't available — install
Chromium manually with your distro's package manager and set
`CHROMIUM_PATH`. See [Install](./install) for the full story.

## 1. Install dependencies

```bash
git clone https://github.com/ideamans/chartjs2img
cd chartjs2img
bun install
```

## 2. Start the HTTP server

```bash
bun run dev
```

You should see:

```
chartjs2img server listening on http://0.0.0.0:3000
  POST /render      - render chart from JSON body
  GET  /render      - render chart from query params
  GET  /cache/:hash - retrieve cached image
  GET  /examples    - examples gallery
  GET  /health      - health check + stats
```

## 3. Render your first chart

In another terminal:

```bash
curl -X POST http://localhost:3000/render \
  -H 'Content-Type: application/json' \
  -d '{
    "chart": {
      "type": "bar",
      "data": {
        "labels": ["Jan", "Feb", "Mar", "Apr"],
        "datasets": [{
          "label": "Sales",
          "data": [12, 19, 3, 5],
          "backgroundColor": "rgba(54, 162, 235, 0.7)"
        }]
      }
    }
  }' \
  -o chart.png
```

Open `chart.png` — that's your first server-rendered Chart.js chart.

## 4. Try the CLI

The same engine works as a one-shot CLI:

```bash
echo '{"type":"bar","data":{"labels":["A","B","C"],"datasets":[{"data":[1,2,3]}]}}' \
  | bun run src/index.ts render -o chart.png
```

## 5. Browse the built-in examples

Visit [http://localhost:3000/examples](http://localhost:3000/examples) to
see 18 chart types rendered live. Clicking one reveals the source JSON
you can copy and tweak.

## Where to next

- **[Install](./install)** — release binaries, Chromium detection, Docker.
- **[HTTP API](./http-api)** — every endpoint, every response header.
- **[CLI](./cli)** — every subcommand and flag.
- **[Bundled plugins](./plugins)** — the 12 Chart.js plugins available out of the box.
- **[Error feedback](./error-feedback)** — how Chart.js errors surface through the API.
- **[AI Guide](/en/ai/)** — using chartjs2img from Claude, Copilot, Cursor, or any MCP agent.
