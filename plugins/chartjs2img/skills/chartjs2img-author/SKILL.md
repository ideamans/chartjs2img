---
name: chartjs2img-author
description: Compose a new Chart.js configuration JSON from a natural-language description and render it with chartjs2img. Use when the user asks you to draw, plot, graph, chart, or visualize data as an image. Picks the chart type, fills in a minimal-but-realistic dataset, validates via chartjs2img-render, and iterates on any error messages until the render is clean.
license: MIT
compatibility: Requires the `chartjs2img` CLI on PATH. Pairs with /chartjs2img-render (for the validate-and-iterate loop). For option tables beyond the catalog below, pipe `chartjs2img llm` into context.
allowed-tools: Bash(chartjs2img:*) Bash(bun:*) Read Write
---

# chartjs2img-author

Turn a description into a validated Chart.js PNG / JPEG / WebP.

This skill is self-contained: the JSON shape, the chartjs2img input
formats, the error-feedback mechanism, and the bundled-plugin catalog
are all inlined below. Only fall out to `chartjs2img llm` (CLI) when
the user needs a deeper option table for a specific plugin.

## Hard constraints (read first)

chartjs2img is a headless renderer around Chart.js 4.4, so a handful
of Chart.js features are unavailable:

- **JSON only** — no JavaScript functions, callbacks, or code. Fields
  like `ticks.callback`, `tooltip.callbacks.*`, datalabels `formatter`
  cannot be expressed in JSON. Use declarative alternatives
  (e.g. `scales.y.ticks.precision`) or omit the option.
- **Animations are forced OFF internally.** Don't set
  `options.animation.*` — the headless screenshot would capture a
  mid-frame anyway.
- **`responsive` and `maintainAspectRatio` are forced internally.** The
  image size is driven by `width` / `height` (HTTP) or `-w` / `-h`
  (CLI), not by the chart config.
- **All plugins auto-register.** Do not set a top-level `plugins: []`
  array; just configure them under `options.plugins.<name>`.
- **Datalabels defaults to OFF.** To show values on the chart you must
  set `options.plugins.datalabels.display: true` explicitly.
- **`labels.length === data.length`.** Mismatches silently produce
  missing points, not an error.

## Input format: CLI

The CLI takes a Chart.js config object **directly** on stdin or via
`-i`:

```bash
echo '{"type":"bar","data":{"labels":["A","B","C"],"datasets":[{"data":[10,20,30]}]}}' \
  | chartjs2img render -o chart.png

chartjs2img render -i config.json -o chart.png -w 800 -h 600 \
  --background-color white --device-pixel-ratio 2 -f png
```

Canonical skeleton:

```json
{
  "type": "bar",
  "data": {
    "labels": ["Jan", "Feb", "Mar"],
    "datasets": [
      {
        "label": "Revenue",
        "data": [100, 200, 150],
        "backgroundColor": "rgba(54, 162, 235, 0.7)"
      }
    ]
  },
  "options": {
    "plugins": {
      "title": { "display": true, "text": "Monthly Revenue" },
      "legend": { "position": "top" }
    }
  }
}
```

## Input format: HTTP

The HTTP server wraps the config in a `chart` field and accepts render
settings as siblings:

```json
{
  "chart": { "type": "bar", "data": { }, "options": { } },
  "width": 800,
  "height": 600,
  "devicePixelRatio": 2,
  "backgroundColor": "white",
  "format": "png",
  "quality": 90
}
```

| Field              | Type   | Default       | Description                             |
| ------------------ | ------ | ------------- | --------------------------------------- |
| `chart`            | object | **required**  | Chart.js configuration                  |
| `width`            | number | 800           | Image width in pixels                   |
| `height`           | number | 600           | Image height in pixels                  |
| `devicePixelRatio` | number | 2             | Retina scaling factor                   |
| `backgroundColor`  | string | `"white"`     | CSS color or `"transparent"`            |
| `format`           | string | `"png"`       | `"png"`, `"jpeg"`, or `"webp"`          |
| `quality`          | number | 90            | JPEG / WebP quality (0–100)             |

## Error feedback

Always capture Chart.js's error stream. chartjs2img surfaces per-chart
problems outside the image:

- **CLI** — stderr carries `[chart ERROR] …` and `[chart WARN] …`
  lines. Always redirect with `2> /tmp/err` and inspect it before
  declaring success.
- **HTTP** — the response header `X-Chart-Messages` is a JSON array of
  `{level, message}` objects. `grep -i '^x-chart-messages' headers.txt`
  after a `curl -D headers.txt` call.

Common error → fix mapping:

| Error fragment                                            | Fix                                                                          |
| --------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `"<X>" is not a registered controller.`                   | Typo in `type` — snap to the nearest value from the plugin catalog below.    |
| `Cannot read properties of undefined (reading 'data')`    | Missing or malformed `datasets` / `labels`. Rebalance lengths.               |
| `The scale "y" doesn't have a parser`                     | Time data without the dayjs adapter — set `scales.x.type: "time"` (bundled). |

## Workflow

1. **Clarify the subject.** One compact question if the request is
   ambiguous (what's the data, what comparison, one chart or
   multiple). Otherwise make reasonable defaults and flag them.
2. **Pick the chart type** from the catalog (next section).
3. **Sketch the data shape.** Small and realistic (2–8 labels,
   1–3 datasets). If the user provides real data, use it verbatim.
4. **Draft the JSON** using the canonical skeleton above.
5. **Validate.** Run the render-and-check loop (same one that
   `/chartjs2img-render` codifies):
   ```bash
   chartjs2img render -i draft.json -o /tmp/draft.png 2> /tmp/draft.err
   ```
   - `[chart ERROR]` → fix and retry (don't declare success).
   - `[chart WARN]` → usually fixable; surface before handing back.
   - Empty stderr → clean render.
6. **Render final.** Offer `-w` / `-h` tweaks if the composition is
   cramped.

## Chart type & plugin catalog (bundled)

| `type`                 | Source plugin                    | When to pick it                       | Data shape                                            |
| ---------------------- | -------------------------------- | ------------------------------------- | ----------------------------------------------------- |
| `bar`                  | Chart.js core                    | Counts / categories compared          | `labels[]` + `datasets[].data[]` (numbers)            |
| `line`                 | Chart.js core                    | Time series, trend                    | `labels[]` + `datasets[].data[]`                      |
| `pie`, `doughnut`      | Chart.js core                    | Part-of-whole, ≤ 8 segments           | `labels[]` + `datasets[].data[]`                      |
| `radar`                | Chart.js core                    | Multi-axis profile                    | `labels[]` + `datasets[].data[]`                      |
| `polarArea`            | Chart.js core                    | Angular part-of-whole                 | `labels[]` + `datasets[].data[]`                      |
| `scatter`              | Chart.js core                    | Two numeric dimensions                | `datasets[].data[]` of `{x, y}`                       |
| `bubble`               | Chart.js core                    | Two numeric dimensions + magnitude    | `datasets[].data[]` of `{x, y, r}`                    |
| `treemap`              | chartjs-chart-treemap            | Hierarchical values                   | `datasets[].tree` array + `key`                       |
| `matrix`               | chartjs-chart-matrix             | Heatmap on a grid                     | `datasets[].data[]` of `{x, y, v}`                    |
| `sankey`               | chartjs-chart-sankey             | Flows between categories              | `datasets[].data[]` of `{from, to, flow}`             |
| `wordCloud`            | chartjs-chart-wordcloud          | Word cloud                            | `labels[]` (words) + `datasets[].data[]` (weights)    |
| `choropleth`, `bubbleMap` | chartjs-chart-geo             | Geographic data (needs GeoJSON)       | `datasets[].data[]` of `{feature, value}`             |
| `graph`, `forceDirectedGraph`, `dendrogram`, `tree` | chartjs-chart-graph | Networks / trees                | `datasets[].data` + `edges`                           |
| `venn`, `euler`        | chartjs-chart-venn               | Set overlaps                          | `labels[]` (set ids) + `datasets[].data[]` (sizes)    |

Plugins that attach to existing types (not new `type` values):

| Plugin                        | Turn on via                                   | What it does                                                 |
| ----------------------------- | --------------------------------------------- | ------------------------------------------------------------ |
| chartjs-plugin-datalabels     | `options.plugins.datalabels.display: true`    | Labels on each data point. Off by default in chartjs2img.    |
| chartjs-plugin-annotation     | `options.plugins.annotation.annotations`      | `line` / `box` / `label` / `point` / `polygon` / `ellipse`.  |
| chartjs-plugin-zoom           | `options.plugins.zoom.limits.*`               | Initial viewport range (no interactivity in static renders). |
| chartjs-plugin-gradient       | `datasets[].backgroundColor` as gradient config | Gradient fills without custom canvas code.                 |
| chartjs-adapter-dayjs-4       | `options.scales.x.type: "time"`               | Time-scale adapter for ISO-date `x` values.                  |

For the full option tables of any plugin above, pipe `chartjs2img llm`:

```bash
# Everything (~1400 lines) — useful for deep exploration.
chartjs2img llm

# A single section.
chartjs2img llm | sed -n '/^## Datalabels/,/^## /p'
```

## Starter snippets

### Bar

```json
{
  "type": "bar",
  "data": {
    "labels": ["A", "B", "C"],
    "datasets": [{ "label": "Series", "data": [10, 20, 30] }]
  }
}
```

### Line (smoothed)

```json
{
  "type": "line",
  "data": {
    "labels": ["Jan", "Feb", "Mar"],
    "datasets": [
      { "data": [1, 2, 3], "borderColor": "rgb(75,192,192)", "tension": 0.3 }
    ]
  }
}
```

### Pie

```json
{
  "type": "pie",
  "data": {
    "labels": ["A", "B", "C"],
    "datasets": [{ "data": [40, 35, 25], "backgroundColor": ["#f66", "#6bf", "#fc6"] }]
  }
}
```

### Scatter

```json
{
  "type": "scatter",
  "data": {
    "datasets": [{ "data": [{ "x": 1, "y": 2 }, { "x": 3, "y": 4 }] }]
  }
}
```

### Time-scale line (dayjs adapter)

```json
{
  "type": "line",
  "data": {
    "datasets": [
      {
        "data": [
          { "x": "2026-01-01", "y": 10 },
          { "x": "2026-02-01", "y": 18 }
        ]
      }
    ]
  },
  "options": { "scales": { "x": { "type": "time" } } }
}
```

### Treemap

```json
{
  "type": "treemap",
  "data": {
    "datasets": [
      {
        "tree": [
          { "value": 500, "label": "A" },
          { "value": 300, "label": "B" }
        ],
        "key": "value"
      }
    ]
  }
}
```

## Iterating

If the first render produces a Chart.js error message, the fix is
usually one of:

1. A typo in `type` — snap to the nearest value from the catalog.
2. A missing `labels` / `data` pairing — rebalance lengths.
3. A wrong data shape for the chart type — `scatter` / `bubble` take
   `{x, y}` (+ `r`), not plain numbers.
4. An unsupported option for the type — strip it.

Keep iterating silently until stderr is empty, then hand back the
final image.
