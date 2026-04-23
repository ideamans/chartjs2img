---
name: chartjs2img-author
description: Compose a new Chart.js configuration JSON from a natural-language description and render it with chartjs2img. Use when the user asks you to draw, plot, graph, chart, or visualize data as an image. Picks the chart type, fills in a minimal-but-realistic dataset, validates via chartjs2img-render, and iterates on any error messages until the render is clean.
license: MIT
compatibility: Requires the `chartjs2img` CLI on PATH. Pairs well with /chartjs2img-llm (for the full option reference) and /chartjs2img-render (for the validate-and-iterate loop).
allowed-tools: Bash(chartjs2img:*) Bash(bun:*) Read Write
---

# chartjs2img-author

Turn a description into a validated Chart.js PNG/JPEG.

## Workflow

1. **Clarify the subject.** Ask one compact question if the request is ambiguous (what's the data, what comparison, one chart or multiple). Otherwise make reasonable defaults and flag them.
2. **Pick the chart type.** Default mapping:
   - Counts / categories compared → `bar`
   - Time series, trend → `line`
   - Part-of-whole, few segments (≤ 8) → `pie` or `doughnut`
   - Two numeric dimensions → `scatter` or `bubble`
   - Multiple axes / skills profile → `radar`
   - Flows between categories → `sankey`
   - Hierarchical values → `treemap`
   - Geographic data → `choropleth` / `bubbleMap`
   - Network → `graph` / `forceDirectedGraph`
   - Set overlaps → `venn`
3. **Sketch the data shape.** Keep it small and realistic (2–8 labels, 1–3 datasets). If the user provides real data, use it verbatim; don't embellish.
4. **Draft the JSON.** Canonical skeleton:
   ```json
   {
     "type": "bar",
     "data": {
       "labels": ["A","B","C"],
       "datasets": [
         { "label": "Series 1", "data": [10,20,30], "backgroundColor": "rgba(54,162,235,0.7)" }
       ]
     },
     "options": {
       "plugins": {
         "title": { "display": true, "text": "Chart title" },
         "legend": { "position": "top" }
       }
     }
   }
   ```
   Add `options.plugins.datalabels.display: true` only if the user wants values on the chart.
5. **Validate.** Use the `/chartjs2img-render` flow:
   ```bash
   chartjs2img render -i draft.json -o /tmp/draft.png 2> /tmp/draft.err
   ```
   - Errors in stderr → fix and retry.
   - Warnings → usually fine, but surface before declaring success.
6. **Render final.** Same command, final output path. Offer sizing tweaks (`-w` / `-h`) if the composition is too cramped.

## Pitfalls to avoid

- **Don't invent a chart type.** Stick to the known set (see /chartjs2img-render for the full list).
- **No callbacks or functions.** Chart.js accepts them at runtime but chartjs2img only speaks JSON. Use declarative options (e.g. `scales.y.ticks.precision` instead of `ticks.callback`).
- **Always set `labels.length === data.length`.** Mismatches silently produce missing points.
- **Time scales need the dayjs adapter.** Set `scales.x.type: "time"` and provide `{x: "ISO-date", y: value}` in `data`. The adapter is bundled.
- **Datalabels is off by default.** If the user asks for "labeled bars", set `options.plugins.datalabels.display: true` and pick sensible `anchor` / `align`.
- **Animations are always off.** Ignore any user request for animated output — chartjs2img produces still images only.

## Starter snippets by type

### Bar

```json
{ "type": "bar", "data": { "labels": [...], "datasets": [{"label":"","data":[...]}] } }
```

### Line with smoothing

```json
{ "type": "line", "data": { "labels": [...], "datasets": [{"data":[...], "borderColor": "rgb(75,192,192)", "tension": 0.3}] } }
```

### Pie

```json
{ "type": "pie", "data": { "labels": [...], "datasets": [{"data":[...], "backgroundColor": ["#f66","#6bf","#fc6","#6cf","#c6f"]}] } }
```

### Scatter

```json
{ "type": "scatter", "data": { "datasets": [{"data":[{"x":1,"y":2},{"x":3,"y":4}]}] } }
```

### Treemap

```json
{ "type": "treemap", "data": { "datasets": [{"tree":[{"value":500,"label":"A"},{"value":300,"label":"B"}],"key":"value"}] } }
```

When the user wants something beyond these, ask /chartjs2img-llm for the canonical option table — every bundled plugin is documented there with a JSON example.

## Iterating

If the first render produces a Chart.js error message, the fix is usually one of:

1. A typo in `type` — snap to the nearest known value.
2. A missing `labels` / `data` pairing — rebalance lengths.
3. A wrong data shape for the chart type — scatter/bubble take `{x,y}` (+ `r`), not plain numbers.
4. An unsupported option for the type — strip it.

Keep iterating silently until stderr is empty, then hand back the final PNG.
