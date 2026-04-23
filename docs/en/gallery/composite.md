---
title: Composite charts
description: Charts that combine datasets or chart types - filled area, stacked bars, and mixed bar + line.
---

# Composite charts

Charts where multiple datasets interact visually, or multiple chart
types share an axis.

## Area chart (filled line)

Line chart with `fill: true` fills below the line.

<Example name="area-chart-filled" http />

## Stacked bar chart

Bar chart with `scales.x.stacked: true` and `scales.y.stacked: true`.

<Example name="stacked-bar-chart" http />

## Mixed chart (bar + line)

Use per-dataset `type:` to combine chart types. Parent `type:` is just
the default for datasets without their own.

<Example name="mixed-chart-bar-line" http />
