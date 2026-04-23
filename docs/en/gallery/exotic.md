---
title: Exotic plugins
description: Chart types that require a Chart.js plugin - treemap is shown in full; pointers given for sankey, matrix, wordcloud, geo, graph, and venn.
---

# Exotic plugins

These chart types aren't part of Chart.js core. Each is brought in by
a dedicated plugin, all bundled with chartjs2img.

## Treemap

![treemap chart](/examples/15-treemap-chart.png)

Uses `chartjs-chart-treemap`. Data is a flat array of `{ value, label }`
objects — treemap handles the layout.

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

## The other exotic chart types

The full set of plugin-provided chart types. Each one has a dedicated
section in `chartjs2img llm` with options + a JSON example.

| `chart.type`            | Plugin                   | What it's for                                    |
| ----------------------- | ------------------------ | ------------------------------------------------ |
| `sankey`                | chartjs-chart-sankey     | Flow diagrams between categorical nodes          |
| `matrix`                | chartjs-chart-matrix     | Heatmaps / cell-grid charts                      |
| `wordcloud`             | chartjs-chart-wordcloud  | Word clouds sized by value                       |
| `choropleth`, `bubbleMap` | chartjs-chart-geo      | Geographic choropleth / bubble maps (requires GeoJSON) |
| `graph`, `forceDirectedGraph`, `dendrogram`, `tree` | chartjs-chart-graph | Network / tree layouts                  |
| `venn`, `euler`         | chartjs-chart-venn       | Set-intersection diagrams                        |

To preview any of them, pipe `chartjs2img llm` to an LLM along with
"generate a config for `<type>`" — every module has a canonical example
the agent can adapt.

### Why isn't every exotic type in the gallery?

Keeping the gallery small + focused means we can verify it on every
change. Treemap is the most commonly requested of the exotic set, so
it's the representative. To see the rest rendered with your own data,
either look at the upstream plugin's own examples or iterate with
chartjs2img's HTTP API.
