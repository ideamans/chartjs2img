---
title: Composite charts
description: Charts that combine datasets or chart types - filled area, stacked bars, and mixed bar + line.
---

# Composite charts

Charts where multiple datasets interact visually, or multiple chart
types share an axis.

## Area chart (filled line)

![area chart filled](/examples/04-area-chart-filled.png)

Line chart with `fill: true` fills below the line.

```json
{
  "type": "line",
  "data": {
    "labels": ["Q1","Q2","Q3","Q4"],
    "datasets": [
      { "label": "Revenue", "data": [40,55,70,85], "borderColor": "rgb(75,192,192)", "backgroundColor": "rgba(75,192,192,0.3)", "fill": true },
      { "label": "Expenses", "data": [30,40,50,60], "borderColor": "rgb(255,99,132)", "backgroundColor": "rgba(255,99,132,0.3)", "fill": true }
    ]
  }
}
```

## Stacked bar chart

![stacked bar chart](/examples/12-stacked-bar-chart.png)

Bar chart with `scales.x.stacked: true` and `scales.y.stacked: true`.

```json
{
  "type": "bar",
  "data": {
    "labels": ["Jan","Feb","Mar","Apr"],
    "datasets": [
      { "label": "Product A", "data": [10,20,15,25], "backgroundColor": "rgba(255,99,132,0.7)" },
      { "label": "Product B", "data": [15,10,20,15], "backgroundColor": "rgba(54,162,235,0.7)" },
      { "label": "Product C", "data": [5,15,10,20], "backgroundColor": "rgba(255,206,86,0.7)" }
    ]
  },
  "options": {
    "scales": { "x": { "stacked": true }, "y": { "stacked": true } }
  }
}
```

## Mixed chart (bar + line)

![mixed chart bar line](/examples/11-mixed-chart-bar-line.png)

Use per-dataset `type:` to combine chart types. Parent `type:` is just
the default for datasets without their own.

```json
{
  "type": "bar",
  "data": {
    "labels": ["Jan","Feb","Mar","Apr","May"],
    "datasets": [
      { "type": "bar", "label": "Sales", "data": [10,20,15,25,30], "backgroundColor": "rgba(54,162,235,0.7)" },
      { "type": "line", "label": "Target", "data": [15,18,20,23,25], "borderColor": "rgb(255,99,132)", "fill": false }
    ]
  }
}
```
