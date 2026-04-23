---
title: Bundled plugins
description: The 12 Chart.js plugins bundled with chartjs2img - datalabels, annotation, zoom, gradient, treemap, matrix, sankey, wordcloud, geo, graph, venn, and the date-fns adapter.
---

# Bundled plugins

The plugin bundle is the same whether you render via the
[CLI](./cli/) or the [HTTP server](./http/) — both share a single
renderer. This page is the reference both tracks point back to.

chartjs2img ships with Chart.js core **plus 12 ecosystem plugins**,
all pre-loaded in the headless browser. You don't install anything —
just use the options in your config JSON.

For each plugin's full option schema, run `chartjs2img llm` and grep
the relevant section, or see the upstream docs linked below.

## Core

| Plugin                                            | Version | Use for                 |
| ------------------------------------------------- | ------- | ----------------------- |
| [chart.js](https://www.chartjs.org/)              | 4.4.9   | Everything — this is Chart.js itself |

Supported `chart.type` values out of the box: `bar`, `line`, `pie`,
`doughnut`, `radar`, `polarArea`, `scatter`, `bubble`.

## Visual decorations

| Plugin                                                                                      | Version | Use for                                      |
| ------------------------------------------------------------------------------------------- | ------- | -------------------------------------------- |
| [chartjs-plugin-datalabels](https://chartjs-plugin-datalabels.netlify.app/)                 | 2.2.0   | Display values on bars, points, slices       |
| [chartjs-plugin-annotation](https://www.chartjs.org/chartjs-plugin-annotation/)             | 3.1.0   | Threshold lines, boxes, labels, polygons     |
| [chartjs-plugin-zoom](https://www.chartjs.org/chartjs-plugin-zoom/)                          | 2.2.0   | Initial-range / zoom configuration           |
| [chartjs-plugin-gradient](https://github.com/kurkle/chartjs-plugin-gradient)                 | 0.6.1   | Gradient fills without manual canvas code    |

> **Note on datalabels:** datalabels is **hidden by default**; turn it on
> explicitly per-chart via `options.plugins.datalabels.display: true`
> (or per-dataset) if you want values to appear.

## Additional chart types

| Plugin                                                                                | Version | Adds chart.type                               |
| ------------------------------------------------------------------------------------- | ------- | --------------------------------------------- |
| [chartjs-chart-matrix](https://chartjs-chart-matrix.pages.dev/)                        | 2.0.1   | `matrix` — heatmaps                           |
| [chartjs-chart-sankey](https://github.com/kurkle/chartjs-chart-sankey)                 | 0.12.1  | `sankey` — flow diagrams                      |
| [chartjs-chart-treemap](https://chartjs-chart-treemap.pages.dev/)                      | 2.3.1   | `treemap` — hierarchical boxes                |
| [chartjs-chart-wordcloud](https://github.com/sgratzl/chartjs-chart-wordcloud)          | 4.4.3   | `wordcloud` — word clouds                     |
| [chartjs-chart-geo](https://github.com/sgratzl/chartjs-chart-geo)                      | 4.3.3   | `choropleth`, `bubbleMap` — geographic charts |
| [chartjs-chart-graph](https://github.com/sgratzl/chartjs-chart-graph)                  | 4.3.3   | `graph`, `forceDirectedGraph`, `dendrogram`, `tree` — networks |
| [chartjs-chart-venn](https://github.com/sgratzl/chartjs-chart-venn)                    | 4.3.3   | `venn`, `euler` — set diagrams                |

## Date adapter

| Plugin                                                                                       | Version | Use for                                       |
| -------------------------------------------------------------------------------------------- | ------- | --------------------------------------------- |
| [chartjs-adapter-date-fns](https://github.com/chartjs/chartjs-adapter-date-fns)              | 3.0.0   | Time-scale axes (`scales.x.type: "time"`)     |

## What's NOT bundled

- **Animation** — `options.animation` is forced OFF internally. The
  renderer needs a stable final frame to screenshot; animations would
  be cropped mid-transition.
- **Custom plugins you bring yourself** — the browser runs only the
  plugins listed above (loaded at page init). To add another plugin,
  see Developer Guide → [Adding a Chart.js plugin](/en/developer/adding-plugin).

## Forcing / overriding at render time

A Chart.js plugin can usually be enabled via
`options.plugins.<name>`. For per-dataset overrides (e.g.
`datalabels`) you can also set per-dataset properties
— see each plugin's upstream docs. `chartjs2img llm` includes the full
option tree for every bundled plugin.
