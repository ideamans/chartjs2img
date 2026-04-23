---
name: chartjs2img-render
description: Render a Chart.js configuration JSON to a PNG/JPEG/WebP image using chartjs2img. Use when the user asks to render, generate, build, or preview a Chart.js chart as an image - either by pointing at a .json file or by handing over the config inline. Captures X-Chart-Messages and echoes Chart.js errors / warnings so a bad config can be fixed without guessing.
license: MIT
compatibility: Requires the `chartjs2img` CLI on PATH (run /chartjs2img-install if missing). Chromium is auto-downloaded on first render.
allowed-tools: Bash(chartjs2img:*) Bash(bun:*) Bash(curl:*) Read Write
---

# chartjs2img-render

Render a Chart.js chart to an image, surface any problems, and hand back the output path.

## Inputs to collect

- The Chart.js **configuration**. Preferred: a `.json` file path. Also accepted: inline JSON text (write it to `./tmp.json` first), or a `chart` object inside an object that wraps it as the HTTP API expects (`{chart: {...}, width, height, ...}` — strip the outer key for the CLI).
- Desired output: file path (`foo.png` / `foo.jpg` / `foo.webp`), or stdout (`-`).
- Optional sizing: `--width`, `--height`, `--device-pixel-ratio`, `--background-color`.
- Optional format / quality: `-f png|jpeg|webp`, `-q 0-100` (JPEG / WebP only).

## Workflow

1. **Locate or materialize the source JSON.** If the user pasted config text, write it to `./tmp.json` (or a path they specified).
2. **Pick the calling mode.**
   - **CLI (preferred for ad-hoc renders):**
     ```bash
     chartjs2img render -i config.json -o chart.png 2> /tmp/chart.err
     ```
     Errors and warnings go to stderr with prefixes `[chart ERROR]` / `[chart WARN]`. Always redirect stderr and inspect it.
   - **HTTP (when a server is already running):**
     ```bash
     curl -s -D /tmp/headers.txt -X POST http://localhost:3000/render \
       -H 'Content-Type: application/json' \
       -d '{"chart":<config>,"width":800,"height":600}' \
       -o chart.png
     grep -i '^x-chart-messages' /tmp/headers.txt
     ```
     `X-Chart-Messages` carries a JSON array of `{level, message}` when anything went wrong.
3. **Check for issues.**
   - If stderr contains `[chart ERROR]`, surface the message verbatim and **do not declare success**.
   - Warnings (`[chart WARN]`) are typically fixable — show them to the user and suggest corrections.
   - No messages → clean render.
4. **Report:** the output path, the file size, and any messages grouped by level. If messages were non-empty, suggest concrete fixes:
   - `"<X>" is not a registered controller.` → typo in `chart.type`; propose the nearest match from the built-in list (bar, line, pie, doughnut, radar, polarArea, scatter, bubble) or the plugin-provided types (treemap, matrix, sankey, wordcloud, choropleth, bubbleMap, graph, forceDirectedGraph, dendrogram, tree, venn, euler).
   - `Cannot read properties of undefined (reading 'data'/'labels'/...)` → missing or malformed `datasets` / `labels`. Echo the expected shape.
   - `The scale "y" doesn't have a parser` → time-series data without the dayjs adapter. Add a non-time `y` or use `chartjs-adapter-dayjs-4` via `options.scales.x.type: "time"`.

## Best practices

- **Never invent a chart type.** Use only the 8 built-in types plus the plugin-provided types listed above. If unsure, call `/chartjs2img-llm` first to read the canonical list.
- **Avoid callbacks in JSON.** Chart.js option fields that take a function (e.g. `ticks.callback`, datalabels `formatter`) can't be expressed in JSON. Use the declarative alternatives or omit the option.
- **Datalabels is off by default** in chartjs2img. To show data labels set `options.plugins.datalabels.display: true` explicitly.
- **Animation is forced off internally.** Don't propose `options.animation.*` — the headless screenshot would capture a mid-frame anyway.
- **Prefer PNG for dashboards, JPEG for email** (smaller file). WebP is best-in-class compression but still has patchy support in older email clients.
- **For captured output use the cache.** `/render` returns `X-Cache-Url` pointing at `/cache/<hash>`. Hand that URL to a CDN or embed in `<img>` — the image is immutable.

## Example minimal render

```bash
echo '{"type":"bar","data":{"labels":["A","B","C"],"datasets":[{"data":[1,2,3]}]}}' \
  | chartjs2img render -o /tmp/demo.png 2> /tmp/demo.err
ls -l /tmp/demo.png
cat /tmp/demo.err     # should be empty on a clean render
```

If `demo.err` is non-empty, iterate before telling the user the render succeeded.
