---
title: Basic chart types
description: Bar, horizontal bar, line, pie, doughnut, radar, polar area, scatter, and bubble - the 9 built-in Chart.js core types, each rendered with a realistic minimal example.
---

# Basic chart types

The nine built-in Chart.js types. Every one of these works out of the
box with `type: "…"` — no plugins required. Switch between the
rendered PNG and the source JSON with the tabs on each example.

## Bar chart

<Example name="bar-chart" http />

## Horizontal bar chart

Same `type: "bar"` with `options.indexAxis: "y"`.

<Example name="horizontal-bar-chart" http />

## Line chart

Multi-dataset with `tension: 0.3` for smooth lines.

<Example name="line-chart" http />

## Pie chart

<Example name="pie-chart" http />

## Doughnut chart

Identical to pie + `chart.type: "doughnut"`.

<Example name="doughnut-chart" http />

## Radar chart

<Example name="radar-chart" http />

## Polar area chart

<Example name="polar-area-chart" http />

## Scatter plot

Datasets take `{x,y}` objects rather than values.

<Example name="scatter-plot" http />

## Bubble chart

Scatter but with radius (`r`) per point.

<Example name="bubble-chart" http />

## Next

- [Composite charts](./composite) — filled area, stacked, mixed-type.
- [Labels & annotation](./decorations) — data labels and threshold lines.
- [Exotic plugins](./exotic) — treemap and beyond.
