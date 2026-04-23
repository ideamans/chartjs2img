---
title: Exotic plugins
description: Chart types that require a Chart.js plugin - treemap, matrix, sankey, wordcloud, venn, graph, tree, and friends. Full JSON for each.
---

# Exotic plugins

These chart types are **not** part of Chart.js core. Each is brought
in by a dedicated plugin, all bundled with chartjs2img. Every snippet
below is copy-pasteable into `chartjs2img render` or POST `/render`.

## Treemap (chartjs-chart-treemap)

![treemap chart](/examples/15-treemap-chart.png)

Hierarchical blocks, sized by the `key` property of each tree node.

```json
{
  "type": "treemap",
  "data": {
    "datasets": [{
      "tree": [
        { "value": 500, "label": "Engineering" },
        { "value": 300, "label": "Sales" },
        { "value": 200, "label": "Marketing" },
        { "value": 150, "label": "Support" },
        { "value": 100, "label": "Finance" }
      ],
      "key": "value",
      "labels": { "display": true, "color": "white", "font": { "size": 14, "weight": "bold" } },
      "backgroundColor": [
        "rgba(255,99,132,0.8)",
        "rgba(54,162,235,0.8)",
        "rgba(255,206,86,0.8)",
        "rgba(75,192,192,0.8)",
        "rgba(153,102,255,0.8)"
      ]
    }]
  }
}
```

## Matrix / heatmap (chartjs-chart-matrix)

Discrete cell grid with per-cell color. JSON can't express a
value-to-color function, so pre-compute one color per cell.

```json
{
  "type": "matrix",
  "data": {
    "datasets": [{
      "label": "Activity",
      "data": [
        { "x": 1, "y": 1, "v":  5 }, { "x": 2, "y": 1, "v": 15 }, { "x": 3, "y": 1, "v": 25 },
        { "x": 1, "y": 2, "v": 10 }, { "x": 2, "y": 2, "v": 30 }, { "x": 3, "y": 2, "v": 20 },
        { "x": 1, "y": 3, "v": 18 }, { "x": 2, "y": 3, "v":  8 }, { "x": 3, "y": 3, "v": 12 }
      ],
      "backgroundColor": [
        "rgba(54,162,235,0.3)", "rgba(54,162,235,0.55)", "rgba(54,162,235,0.85)",
        "rgba(54,162,235,0.4)", "rgba(54,162,235,0.95)", "rgba(54,162,235,0.7)",
        "rgba(54,162,235,0.6)", "rgba(54,162,235,0.35)", "rgba(54,162,235,0.45)"
      ],
      "borderColor": "white",
      "borderWidth": 2,
      "width": 60,
      "height": 60
    }]
  },
  "options": {
    "plugins": { "legend": { "display": false } },
    "scales": {
      "x": { "type": "linear", "position": "bottom", "offset": true, "ticks": { "stepSize": 1 } },
      "y": { "type": "linear", "position": "left", "offset": true, "ticks": { "stepSize": 1 }, "reverse": true }
    }
  }
}
```

## Sankey (chartjs-chart-sankey)

Flow between categorical nodes. `flow` is the width of each band.

```json
{
  "type": "sankey",
  "data": {
    "datasets": [{
      "data": [
        { "from": "Oil",          "to": "Fossil Fuels", "flow": 15 },
        { "from": "Coal",         "to": "Fossil Fuels", "flow": 25 },
        { "from": "Gas",          "to": "Fossil Fuels", "flow": 20 },
        { "from": "Solar",        "to": "Renewables",   "flow": 10 },
        { "from": "Wind",         "to": "Renewables",   "flow":  8 },
        { "from": "Hydro",        "to": "Renewables",   "flow": 12 },
        { "from": "Fossil Fuels", "to": "Electricity",  "flow": 35 },
        { "from": "Fossil Fuels", "to": "Transport",    "flow": 25 },
        { "from": "Renewables",   "to": "Electricity",  "flow": 30 }
      ],
      "colorFrom": "#36a2eb",
      "colorTo":   "#ff6384",
      "colorMode": "gradient",
      "labels": {
        "Oil": "Crude Oil",
        "Coal": "Coal Mining",
        "Gas": "Natural Gas",
        "Solar": "Solar PV",
        "Wind": "Wind Power",
        "Hydro": "Hydroelectric",
        "Electricity": "Grid",
        "Transport": "Vehicles"
      }
    }]
  },
  "options": { "plugins": { "legend": { "display": false } } }
}
```

## Word cloud (chartjs-chart-wordcloud)

Words come from `data.labels`, font sizes come from `datasets[0].data`.

```json
{
  "type": "wordCloud",
  "data": {
    "labels": [
      "Chart.js", "D3", "Plotly", "Recharts", "Highcharts",
      "Vega", "ECharts", "ApexCharts", "Observable", "Tableau",
      "PowerBI", "Looker", "Superset", "Metabase"
    ],
    "datasets": [{
      "data": [90, 80, 60, 50, 45, 35, 70, 40, 55, 65, 50, 40, 45, 35],
      "color": [
        "#36a2eb", "#ff6384", "#ffce56", "#4bc0c0", "#9966ff",
        "#ff9f40", "#c9cbcf", "#7bc8a4", "#5cb85c", "#f0ad4e",
        "#5bc0de", "#d9534f", "#337ab7", "#8e44ad"
      ]
    }]
  },
  "options": {
    "elements": {
      "word": { "minRotation": 0, "maxRotation": 0, "padding": 4 }
    },
    "plugins": { "legend": { "display": false } }
  }
}
```

## Venn / Euler (chartjs-chart-venn)

Set overlaps. Use `"type": "venn"` for a standard layout, `"type": "euler"`
when circle sizes and overlaps should be proportional to values.

```json
{
  "type": "euler",
  "data": {
    "labels": [
      "A", "B", "C",
      "A ∩ B", "A ∩ C", "B ∩ C",
      "A ∩ B ∩ C"
    ],
    "datasets": [{
      "label": "Three-set Euler",
      "data": [
        { "sets": ["A"],           "value": 12 },
        { "sets": ["B"],           "value": 10 },
        { "sets": ["C"],           "value":  8 },
        { "sets": ["A", "B"],      "value":  4 },
        { "sets": ["A", "C"],      "value":  3 },
        { "sets": ["B", "C"],      "value":  2 },
        { "sets": ["A", "B", "C"], "value":  1 }
      ],
      "backgroundColor": [
        "rgba(54,162,235,0.5)",
        "rgba(255,99,132,0.5)",
        "rgba(255,206,86,0.5)"
      ],
      "borderColor": [
        "rgba(54,162,235,1)",
        "rgba(255,99,132,1)",
        "rgba(255,206,86,1)"
      ]
    }]
  }
}
```

## Force-directed graph (chartjs-chart-graph)

Network layout via physics simulation — no coordinates needed.

```json
{
  "type": "forceDirectedGraph",
  "data": {
    "labels": [
      "Gateway", "Auth", "Users", "Orders", "Payments",
      "Inventory", "DB", "Cache", "Queue"
    ],
    "datasets": [{
      "data": [{}, {}, {}, {}, {}, {}, {}, {}, {}],
      "edges": [
        { "source": 0, "target": 1 },
        { "source": 0, "target": 2 },
        { "source": 0, "target": 3 },
        { "source": 3, "target": 4 },
        { "source": 3, "target": 5 },
        { "source": 2, "target": 6 },
        { "source": 5, "target": 6 },
        { "source": 4, "target": 7 },
        { "source": 3, "target": 8 },
        { "source": 1, "target": 7 }
      ],
      "pointRadius": 12,
      "pointBackgroundColor": "#36a2eb",
      "pointBorderColor": "#1e5a8e",
      "pointBorderWidth": 2
    }]
  },
  "options": {
    "plugins": { "legend": { "display": false } },
    "simulation": {
      "initialIterations": 100,
      "forces": {
        "link":      { "distance": 80 },
        "manyBody":  { "strength": -300 },
        "collide":   { "radius": 18, "strength": 0.8 }
      }
    }
  }
}
```

For a **manual-layout** graph instead (explicit `{x,y}` per node), use
`"type": "graph"` and supply coordinates in `data`. The
[plugin docs](https://github.com/sgratzl/chartjs-chart-graph) cover
the full option surface.

## Tidy tree (chartjs-chart-graph)

Hierarchical layout driven by a `parent` index per node.

```json
{
  "type": "tree",
  "data": {
    "labels": [
      "CEO",
      "CTO", "COO", "CFO",
      "VP Eng", "VP Product",
      "Ops Dir", "Sales Dir",
      "FP&A",
      "Platform", "Frontend", "Mobile",
      "Design", "Research"
    ],
    "datasets": [{
      "data": [
        {},
        { "parent": 0 }, { "parent": 0 }, { "parent": 0 },
        { "parent": 1 }, { "parent": 1 },
        { "parent": 2 }, { "parent": 2 },
        { "parent": 3 },
        { "parent": 4 }, { "parent": 4 }, { "parent": 4 },
        { "parent": 5 }, { "parent": 5 }
      ],
      "pointRadius": 6,
      "pointBackgroundColor": "#36a2eb",
      "pointBorderColor": "#1e5a8e",
      "pointBorderWidth": 2
    }]
  },
  "options": {
    "plugins": { "legend": { "display": false } },
    "tree": { "orientation": "horizontal" }
  }
}
```

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
eyeball. Treemap is the representative PNG; every other exotic type
is exercised by `chartjs2img llm`'s canonical example (agents read
those automatically) and by the JSON snippets above. To preview any
of them with your own data, paste the snippet into
`chartjs2img render -i <file> -o out.png`.
