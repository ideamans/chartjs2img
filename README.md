# chartjs2img

Server-side Chart.js rendering service. Takes a Chart.js configuration as JSON, renders it to an image using headless Chromium (via `puppeteer-core`), and returns the result. Ships as an HTTP API, a CLI, and a TypeScript / Node library.

Built for generating charts in contexts where a browser isn't available — email campaigns, PowerPoint generation, PDF reports, Slack bots, LLM tool calls, etc.

Full documentation (EN / JA): <https://chartjs2img.ideamans.com>

## Features

- **Chart.js 4.4 + 11 plugins + date-fns adapter** built-in (see [Included Plugins](#included-plugins))
- **HTTP API** — POST JSON, get an image back
- **CLI** — pipe JSON in, get an image out
- **Library API** — `import { renderChart } from 'chartjs2img'` from any Bun / Node program
- **Claude Code plugin** — ships three Agent Skills (`/chartjs2img-render`, `/chartjs2img-author`, `/chartjs2img-install`) under `plugins/chartjs2img/`
- **Hash-based caching** — identical requests return cached images instantly
- **Concurrency control** — configurable semaphore prevents resource exhaustion
- **Browser lifecycle management** — auto-restart on crash, orphaned page cleanup
- **API key authentication** — optional, via header or query param
- **Japanese text support** — Noto Sans CJK included in Docker image (no tofu)
- **Error feedback** — Chart.js errors/warnings captured and returned via header (HTTP) or stderr (CLI)
- **LLM integration** — `chartjs2img llm` outputs a full Chart.js + plugin reference in Markdown; `docs/public/llms.txt` / `llms-full.txt` are published for retrieval agents
- **Examples gallery** — built-in `/examples` page (35 configurations) for visual verification
- **Single binary** — compile with `bun build --compile` for easy distribution

## Prerequisites

You need [Bun](https://bun.sh) installed. If you haven't installed it yet:

```bash
# macOS / Linux
curl -fsSL https://bun.sh/install | bash

# Then restart your terminal, or run:
source ~/.bashrc   # or ~/.zshrc
```

Verify it's working:

```bash
bun --version
```

## Chrome / Chromium

chartjs2img requires Chrome or Chromium to render charts. On first run, it searches for an existing installation in this order:

1. `CHROMIUM_PATH` environment variable
2. `ms-playwright` browser cache (`~/Library/Caches/ms-playwright/` etc. — reused if a prior Playwright install is present)
3. System-installed Chrome/Chromium (`/Applications/Google Chrome.app`, `/usr/bin/google-chrome`, etc.)
4. **Auto-download** — if nothing is found, [Chrome for Testing](https://googlechromelabs.github.io/chrome-for-testing/) is downloaded automatically to the user cache directory (no sudo required)

Auto-download is available for **macOS (x64/arm64)**, **Windows (x64/x86)**, and **Linux (x64)**. 

> **Linux ARM64:** Chrome for Testing does not provide linux-arm64 builds. You must install Chromium manually:
> ```bash
> # Debian/Ubuntu
> sudo apt install chromium-browser
> # or
> sudo apt install chromium
> ```
> Then either let chartjs2img detect it automatically, or set `CHROMIUM_PATH`:
> ```bash
> export CHROMIUM_PATH=/usr/bin/chromium-browser
> ```

## Quick Start

### 1. Install dependencies

```bash
cd chartjs2img
bun install
```

This installs the Node.js packages. Bun uses `node_modules` just like npm, but it's much faster.

### 2. Start the development server

> **Zero-config:** You do **not** need to install Chromium manually. On first run, if Chromium is not found, it will be downloaded automatically (~250 MB one-time download). Just run the command below and wait for the install to complete.

```bash
bun run dev
```

This starts the HTTP server on `http://localhost:3000`. You should see:

```
chartjs2img server listening on http://0.0.0.0:3000
  POST /render      - render chart from JSON body
  GET  /render      - render chart from query params
  GET  /cache/:hash - retrieve cached image
  GET  /examples    - examples gallery
  GET  /health      - health check + stats
```

> `bun run dev` is equivalent to `bun run src/index.ts serve`. You can also pass options directly:
> ```bash
> bun run src/index.ts serve --port 8080 --api-key mysecret
> ```

### 3. Open the examples gallery

Visit [http://localhost:3000/examples](http://localhost:3000/examples) in your browser to see all chart types rendered live.

### 4. Render your first chart

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

## npm Scripts Reference

| Command | What it does |
|---------|-------------|
| `bun run dev` | Start the HTTP server (development) |
| `bun run start` | Same as `bun run dev` |
| `bun run cli -- <cmd>` | Run any CLI subcommand (e.g., `bun run cli -- llm`) |
| `bun run typecheck` | Run `tsc --noEmit` |
| `bun run build` | Compile to a single binary `./chartjs2img` |
| `bun run build:lib` | Emit the library bundle to `dist/` (used by `prepublishOnly`) |
| `bun run ai:regen` | Rebuild `docs/public/llms.txt` / `llms-full.txt` from `src/llm-docs/` + `docs/en/` |
| `bun run validate-plugin-skills` | Validate the SKILL.md files under `plugins/chartjs2img/skills/` |
| `bun run docs:dev` | VitePress dev server for the documentation site |
| `bun run docs:build` | Full docs build (llms.txt + diagrams + example images + VitePress) |
| `bun run docs:examples` | Regenerate the PNG / JSON pairs under `docs/public/examples/` |
| `bun run docs:diagrams` | Regenerate the architecture diagrams under `docs/public/diagrams/` |
| `bun run docs:preview` | Preview the built docs site |

> **Tip:** You can always run TypeScript files directly with Bun — no compilation step needed for development:
> ```bash
> bun run src/index.ts serve --port 8080
> ```

> **AI-facing artifacts are generated.** `docs/public/llms.txt`, `docs/public/llms-full.txt`, and `docs/public/examples/**` are derived from `src/llm-docs/`, `src/examples.ts`, and `docs/en/**`. Do not hand-edit them — run `bun run ai:regen` (or `/regen-ai`) after changing the sources. See `.claude/rules/ai-artifacts-policy.md`.

## HTTP API

### `POST /render`

Render a chart from a JSON body.

**Request body:**

```json
{
  "chart": { },
  "width": 800,
  "height": 600,
  "devicePixelRatio": 2,
  "backgroundColor": "white",
  "format": "png",
  "quality": 90
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `chart` | object | *required* | Chart.js configuration (type, data, options, plugins) |
| `width` | number | 800 | Image width in pixels |
| `height` | number | 600 | Image height in pixels |
| `devicePixelRatio` | number | 2 | Retina scaling factor |
| `backgroundColor` | string | `"white"` | CSS background color (`"transparent"` supported) |
| `format` | string | `"png"` | Output format: `png` or `jpeg` |
| `quality` | number | 90 | JPEG quality (0-100) |

**Response headers:**

| Header | Description |
|--------|-------------|
| `X-Cache-Hash` | Unique hash for this chart configuration |
| `X-Cache-Url` | Full URL to retrieve this image from cache |
| `X-Cache-Hit` | `"true"` if served from cache, `"false"` if freshly rendered |
| `X-Chart-Messages` | JSON array of `{level, message}` from Chart.js (only present if errors/warnings occurred) |

### `GET /render`

Same as POST, but pass parameters as query strings. Useful for `<img>` tags.

```
GET /render?chart={"type":"bar","data":{...}}&width=400&height=300
```

### `GET /cache/:hash`

Retrieve a previously rendered image by its cache hash. The hash is returned in the `X-Cache-Hash` response header of `/render`.

```bash
# Render and get the cache hash
HASH=$(curl -s -D- -X POST http://localhost:3000/render \
  -H 'Content-Type: application/json' \
  -d '{"chart":{"type":"bar","data":{"labels":["A","B"],"datasets":[{"data":[1,2]}]}}}' \
  -o /dev/null | grep -i x-cache-hash | awk '{print $2}' | tr -d '\r')

# Access the cached image later
curl -o chart.png "http://localhost:3000/cache/$HASH"
```

### `GET /health`

Returns server status, renderer stats, and cache info.

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

### `GET /examples`

Built-in gallery page showing 35 chart examples rendered in real time. Useful for visual verification and as a reference for building chart configurations.

## Authentication

API key authentication is optional. When enabled, every request to `/render` and `/cache/:hash` must include the key in one of these ways:

```bash
# Authorization header
curl -H 'Authorization: Bearer YOUR_KEY' ...

# X-API-Key header
curl -H 'X-API-Key: YOUR_KEY' ...

# Query parameter
curl 'http://localhost:3000/render?api_key=YOUR_KEY&chart=...'
```

Set the key via CLI flag or environment variable:

```bash
bun run src/index.ts serve --api-key YOUR_KEY
# or
API_KEY=YOUR_KEY bun run dev
```

## CLI Usage

### LLM Help

Print extended documentation for LLMs — covers Chart.js core and all plugin parameters in Markdown:

```bash
chartjs2img llm
# or
bun run cli -- llm
```

This outputs ~1440 lines of structured Markdown reference, organized per module:

- **Usage guide** — input format (CLI / HTTP), constraints (JSON only, no functions)
- **Chart.js core** — all chart types, dataset properties, scales, title/legend/tooltip
- **11 plugins + date adapter** — datalabels, annotation, zoom, gradient, treemap, matrix, sankey, wordcloud, geo, graph, venn, and the date-fns adapter

Each section includes option tables (property, type, default, description) and JSON examples.

**Use cases:**

```bash
# Feed as system prompt context to an LLM
chartjs2img llm | pbcopy   # copy to clipboard (macOS)

# Save to a file for reuse
chartjs2img llm > chartjs2img-reference.md

# Pipe directly into an LLM CLI tool
chartjs2img llm | llm -s "Generate a bar chart config for monthly sales data"
```

The output includes a disclaimer noting that the documentation may contain inaccuracies. LLMs should prioritize Chart.js error messages (returned via [Error Feedback](#error-feedback)) over this reference when debugging.

**Maintaining the docs:** Each module's documentation lives in its own file under `src/llm-docs/`. When a plugin is added or removed, add/remove the corresponding file and update `src/llm-docs/index.ts`. Then regenerate the published `llms.txt` / `llms-full.txt` with `bun run ai:regen`.

### Rendering

Render charts directly from the command line without starting a server.

```bash
# From a JSON file
bun run src/index.ts render -i chart.json -o chart.png

# From stdin
echo '{"type":"bar","data":{"labels":["A","B"],"datasets":[{"data":[1,2]}]}}' \
  | bun run src/index.ts render -o chart.png

# With options
bun run src/index.ts render -i chart.json -o chart.png -w 1200 -h 400 -f jpeg -q 85
```

| Flag | Description |
|------|-------------|
| `-i, --input <file>` | Input JSON file (default: stdin) |
| `-o, --output <file>` | Output image file (default: stdout) |
| `-w, --width <px>` | Width (default: 800) |
| `-h, --height <px>` | Height (default: 600) |
| `--device-pixel-ratio <n>` | DPR (default: 2) |
| `--background-color <color>` | Background (default: white) |
| `-f, --format <fmt>` | png, jpeg (default: png) |
| `-q, --quality <0-100>` | JPEG quality (default: 90) |

### Batch rendering built-in examples

```bash
# PNG files into ./gallery
chartjs2img examples -o ./gallery

# JPEG at quality 80
chartjs2img examples -o ./gallery -f jpeg -q 80
```

This iterates the 35 bundled chart configs (the same set shown by `GET /examples`) and writes one image per entry. Useful for smoke-testing a new plugin bundle or for regenerating reference images.

### Other subcommands

| Command | Description |
|---------|-------------|
| `chartjs2img help` / `--help` / `-h` | Show the full usage banner |
| `chartjs2img version` / `--version` | Print the version number |

## Library API

Use chartjs2img programmatically from any Bun or Node program:

```ts
import { renderChart, closeBrowser, computeHash, BUNDLED_LIBS, VERSION } from 'chartjs2img'

const result = await renderChart({
  chart: {
    type: 'bar',
    data: {
      labels: ['A', 'B', 'C'],
      datasets: [{ data: [1, 2, 3] }],
    },
  },
  width: 800,
  height: 600,
  format: 'png',
})

await Bun.write('chart.png', result.buffer)
if (result.messages.length) console.warn(result.messages)

// Call once on process shutdown to release the shared browser
await closeBrowser()
```

Exports:

| Symbol | Purpose |
|--------|---------|
| `renderChart(options)` | Render a single chart using a lazily-created default `Renderer` |
| `closeBrowser()` | Close the shared headless browser on shutdown |
| `rendererStats()` | Browser / concurrency / page counters (same shape as `/health`) |
| `Renderer` | Class for advanced callers that want isolated browser pools / concurrency |
| `computeHash(options)` | Deterministic hash of a render input (for your own cache layer) |
| `BUNDLED_LIBS` | Frozen table of Chart.js + plugin versions baked into the page |
| `VERSION`, `NAME` | Package identification |

Types: `RenderOptions`, `RenderResult`, `ConsoleMessage`, `RendererConfig`, `RendererStats`.

## Error Feedback

Chart.js errors and warnings are captured from the browser console during rendering and returned to the caller. This helps diagnose invalid configurations without guessing.

### CLI

Errors and warnings are printed to stderr:

```bash
$ echo '{"type":"invalid","data":{"labels":["A"],"datasets":[{"data":[1]}]}}' \
  | chartjs2img render -o chart.png
[chart ERROR] "invalid" is not a registered controller.
Written to chart.png (hash: ...)
```

### HTTP API

When messages are present, the response includes an `X-Chart-Messages` header containing a JSON array:

```bash
$ curl -s -D- -X POST http://localhost:3000/render \
  -H 'Content-Type: application/json' \
  -d '{"chart":{"type":"invalid","data":{"labels":["A"],"datasets":[{"data":[1]}]}}}' \
  -o /dev/null | grep X-Chart-Messages

X-Chart-Messages: [{"level":"error","message":"\"invalid\" is not a registered controller."}]
```

Each message has:

| Field | Values | Description |
|-------|--------|-------------|
| `level` | `"error"`, `"warn"` | Severity level |
| `message` | string | Message text from Chart.js |

> **Note:** Rendering still completes even when errors occur — the resulting image may be blank or partial. Always check `X-Chart-Messages` to determine if the chart configuration was valid.

## Environment Variables

All settings can be configured via environment variables, making it easy to configure in Docker or CI.

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP server port |
| `HOST` | `0.0.0.0` | HTTP server bind address |
| `API_KEY` | *(none)* | API key for authentication |
| `CONCURRENCY` | `8` | Max simultaneous renders |
| `CACHE_MAX_ENTRIES` | `1000` | Max cached images in memory |
| `CACHE_TTL_SECONDS` | `3600` | Cache entry lifetime (seconds) |
| `MAX_RENDER_TIME_SECONDS` | `30` | Per-render upper bound (goto + waitForFunction timeout) |
| `PAGE_TIMEOUT_SECONDS` | *(derived)* | Override the safety-net force-close timer. Defaults to `MAX_RENDER_TIME_SECONDS * 2 + 10s` |

## Included Plugins

All plugins are loaded from CDN inside the headless browser. No extra installation needed.

### Core

| Plugin | Version | Description |
|--------|---------|-------------|
| [chart.js](https://www.chartjs.org/) | 4.4.9 | Chart.js core |

### Plugins

| Plugin | Version | Description |
|--------|---------|-------------|
| [chartjs-plugin-datalabels](https://chartjs-plugin-datalabels.netlify.app/) | 2.2.0 | Display values on chart elements |
| [chartjs-plugin-annotation](https://www.chartjs.org/chartjs-plugin-annotation/) | 3.1.0 | Threshold lines, boxes, labels |
| [chartjs-plugin-zoom](https://www.chartjs.org/chartjs-plugin-zoom/) | 2.2.0 | Zoom and pan (initial range) |
| [chartjs-plugin-gradient](https://github.com/kurkle/chartjs-plugin-gradient) | 0.6.1 | Easy gradient fills |

### Additional Chart Types

| Plugin | Version | Description |
|--------|---------|-------------|
| [chartjs-chart-matrix](https://chartjs-chart-matrix.pages.dev/) | 2.0.1 | Heatmaps and matrix charts |
| [chartjs-chart-sankey](https://github.com/kurkle/chartjs-chart-sankey) | 0.12.1 | Sankey diagrams |
| [chartjs-chart-treemap](https://chartjs-chart-treemap.pages.dev/) | 2.3.1 | Treemap charts |
| [chartjs-chart-wordcloud](https://github.com/sgratzl/chartjs-chart-wordcloud) | 4.4.3 | Word clouds |
| [chartjs-chart-geo](https://github.com/sgratzl/chartjs-chart-geo) | 4.3.3 | Choropleth and bubble maps |
| [chartjs-chart-graph](https://github.com/sgratzl/chartjs-chart-graph) | 4.3.3 | Network graphs |
| [chartjs-chart-venn](https://github.com/sgratzl/chartjs-chart-venn) | 4.3.3 | Venn and Euler diagrams |

### Date Adapter

| Plugin | Version | Description |
|--------|---------|-------------|
| [chartjs-adapter-date-fns](https://github.com/chartjs/chartjs-adapter-date-fns) | 3.0.0 | date-fns adapter for time-series axes (bundled build — date-fns included) |

## Docker

### Build

```bash
docker build -t chartjs2img .
```

### Run

```bash
docker run -p 3000:3000 chartjs2img

# With configuration
docker run -p 3000:3000 \
  -e API_KEY=mysecret \
  -e CONCURRENCY=4 \
  chartjs2img
```

The Docker image includes:
- Bun runtime
- Playwright + Chromium (headless)
- Noto Sans CJK fonts (Japanese, Chinese, Korean — no tofu characters)

### Docker Compose

```yaml
services:
  chartjs2img:
    build: .
    ports:
      - "3000:3000"
    environment:
      - API_KEY=mysecret
      - CONCURRENCY=8
      - CACHE_MAX_ENTRIES=2000
      - CACHE_TTL_SECONDS=7200
```

## Building a Single Binary

Bun can compile the entire project into a standalone executable:

```bash
bun run build
# or directly:
bun build src/index.ts --compile --outfile chartjs2img
```

This produces a `./chartjs2img` binary that can be distributed without requiring Bun or Node.js on the target machine.

> **Note:** Playwright's Chromium browser is **not** bundled into the binary, but it will be **downloaded automatically** on first run if not found. Just distribute the binary — everything else is handled.

```bash
# Use the compiled binary — Chromium auto-installs on first run
./chartjs2img serve --port 3000
./chartjs2img render -i chart.json -o chart.png
```

## Claude Code Plugin

`plugins/chartjs2img/` is a self-contained [Claude Code plugin](https://docs.claude.com/en/docs/claude-code/plugins) that exposes three Agent Skills:

| Skill | Purpose |
|-------|---------|
| `/chartjs2img-render` | Render a Chart.js config JSON to PNG / JPEG, surfacing `X-Chart-Messages` / stderr warnings |
| `/chartjs2img-author` | Compose a new Chart.js config from a natural-language description, then validate via render-and-iterate |
| `/chartjs2img-install` | Install or update the `chartjs2img` CLI from the GitHub Releases of `ideamans/chartjs2img` |

Install into Claude Code by pointing at this repository's `plugins/chartjs2img/` directory (or by publishing / distributing that folder on its own). The plugin manifest lives at `plugins/chartjs2img/.claude-plugin/plugin.json` and its version is kept in sync with `package.json`.

When editing skill bodies, regenerate the AI-facing artifacts with `bun run ai:regen` and validate with `bun run validate-plugin-skills`.

## Documentation Site

Full English + Japanese docs are built with VitePress and deployed to <https://chartjs2img.ideamans.com>:

- `docs/en/**`, `docs/ja/**` — hand-written guide, CLI / HTTP / Docker references, examples gallery, developer notes
- `docs/public/llms.txt`, `docs/public/llms-full.txt` — LLM-oriented index + full bundle (generated by `bun run ai:regen`)
- `docs/public/examples/**` — PNG + JSON for every built-in example (generated by `bun run docs:examples`)

Run `bun run docs:dev` to preview locally. Do **not** hand-edit the generated files — see `.claude/rules/ai-artifacts-policy.md` for the SSOT mapping.

## Architecture

```
Request flow:

  HTTP Request
       │
       ▼
  ┌─────────┐    ┌──────────┐
  │  Auth    │───▶│  Cache   │──▶ Cache Hit → return image
  │  Check   │    │  Lookup  │
  └─────────┘    └──────────┘
                      │ Cache Miss
                      ▼
                 ┌──────────┐
                 │ Semaphore │──▶ Wait if at max concurrency
                 └──────────┘
                      │ Acquired
                      ▼
                 ┌──────────┐
                 │  Ensure  │──▶ Launch browser if not running
                 │ Browser  │    Auto-restart if crashed
                 └──────────┘
                      │
                      ▼
                 ┌──────────┐
                 │ New Page  │──▶ Fresh tab with 60s timeout
                 │ (Tab)     │
                 └──────────┘
                      │
                      ▼
                 ┌──────────┐
                 │ Render   │──▶ Load HTML + Chart.js + plugins
                 │ Chart    │    Screenshot canvas element
                 └──────────┘
                      │
                      ▼
                 ┌──────────┐
                 │  Store   │──▶ Cache by SHA-256 hash
                 │  Cache   │    Return image + cache headers
                 └──────────┘
                      │
                      ▼
                 Close page, release semaphore
```

## License

MIT
