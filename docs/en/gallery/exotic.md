---
title: Exotic plugins
description: Chart types that require a Chart.js plugin - treemap, matrix, sankey, wordcloud, venn, graph, tree, and friends. Full JSON for each.
---

# Exotic plugins

These chart types are **not** part of Chart.js core. Each is brought
in by a dedicated plugin, all bundled with chartjs2img. Every example
below shows the rendered PNG, the JSON config, and a ready-to-run CLI
/ HTTP snippet — flip between tabs to see each.

## Treemap (chartjs-chart-treemap)

Hierarchical blocks, sized by the `tree` values of each node.

<Example name="treemap-chart" http />

## Matrix / heatmap (chartjs-chart-matrix)

Discrete cell grid with per-cell color. JSON can't express a
value-to-color function, so pre-compute one color per cell.

<Example name="matrix-heatmap" http />

## Sankey (chartjs-chart-sankey)

Flow between categorical nodes. `flow` is the width of each band.

<Example name="sankey-flow" http />

## Word cloud (chartjs-chart-wordcloud)

Words come from `data.labels`, font sizes come from `datasets[0].data`.

<Example name="word-cloud" http />

## Venn / Euler (chartjs-chart-venn)

Set overlaps. Use `"type": "venn"` for a standard layout,
`"type": "euler"` when circle sizes and overlaps should be
proportional to values.

<Example name="euler-diagram-3-set" http />

## Force-directed graph (chartjs-chart-graph)

Network layout via physics simulation — no coordinates needed.

<Example name="force-directed-graph" http />

For a **manual-layout** graph instead (explicit `{x,y}` per node), use
`"type": "graph"` and supply coordinates in `data`. The
[plugin docs](https://github.com/sgratzl/chartjs-chart-graph) cover
the full option surface.

## Tidy tree (chartjs-chart-graph)

Hierarchical layout driven by a `parent` index per node.

<Example name="tidy-tree" http />

Switch to `"type": "dendrogram"` for a fixed-depth cluster layout, or
set `options.tree.orientation: "radial"` for a circular tree.

## Choropleth / bubble map (chartjs-chart-geo)

Geographic maps require GeoJSON inline — there is no URL-loading
mechanism. Fetch `FeatureCollection` data from a source like Natural
Earth or TopoJSON, then inline it into the request body.

Skeleton for a choropleth:

```jsonc
{
  "type": "choropleth",
  "data": {
    "labels": ["France", "Germany", "Italy", "Spain"],
    "datasets": [{
      "outline": [ /* GeoJSON Feature[] for bounds */ ],
      "showOutline": true,
      "borderColor": "#888",
      "data": [
        { "feature": { "type": "Feature", "geometry": { /* ... */ },
                        "properties": { "name": "France" } },
          "value": 67 },
        { "feature": { /* ... */ }, "value": 83 },
        { "feature": { /* ... */ }, "value": 59 },
        { "feature": { /* ... */ }, "value": 47 }
      ]
    }]
  },
  "options": {
    "plugins": { "legend": { "display": false } },
    "scales": {
      "projection": { "axis": "x", "projection": "equalEarth" },
      "color":      { "axis": "x", "quantize": 5, "display": false }
    }
  }
}
```

For a `bubbleMap`, keep the same `outline` / scale config and supply
data as `{ longitude, latitude, value }` points.

Because full GeoJSON payloads are large, chartjs2img doesn't ship a
rendered choropleth in the default gallery — build one against your
own dataset and `/chartjs2img-render` will gladly produce it.

## Why not every exotic type?

The gallery stays small on purpose so visual regressions are easy to
eyeball. The rendered examples above cover the primary layout styles
each plugin provides; every other exotic variant is exercised by
`chartjs2img llm`'s canonical example (agents read those
automatically) and by the JSON snippets above. To preview any of
them with your own data, paste the snippet into
`chartjs2img render -i <file> -o out.png`.
