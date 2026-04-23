---
title: Basic chart types
description: Bar, horizontal bar, line, pie, doughnut, radar, polar area, scatter, and bubble - the 9 built-in Chart.js core types, each rendered with a realistic minimal example.
---

# Basic chart types

The nine built-in Chart.js types. Every one of these works out of the
box with `type: "…"` — no plugins required.

## Bar chart

![bar chart](/examples/01-bar-chart.png)

```json
{
  "type": "bar",
  "data": {
    "labels": ["January","February","March","April","May","June"],
    "datasets": [
      {
        "label": "Revenue ($K)",
        "data": [12, 19, 3, 5, 2, 15],
        "backgroundColor": [
          "rgba(255, 99, 132, 0.7)",
          "rgba(54, 162, 235, 0.7)",
          "rgba(255, 206, 86, 0.7)",
          "rgba(75, 192, 192, 0.7)",
          "rgba(153, 102, 255, 0.7)",
          "rgba(255, 159, 64, 0.7)"
        ]
      }
    ]
  }
}
```

## Horizontal bar chart

![horizontal bar chart](/examples/02-horizontal-bar-chart.png)

Same `type: "bar"` with `options.indexAxis: "y"`.

```json
{
  "type": "bar",
  "data": {
    "labels": ["Red","Blue","Yellow","Green","Purple"],
    "datasets": [
      { "label": "Votes", "data": [12,19,3,5,2], "backgroundColor": "rgba(54,162,235,0.7)" }
    ]
  },
  "options": { "indexAxis": "y" }
}
```

## Line chart

![line chart](/examples/03-line-chart.png)

Multi-dataset with `tension: 0.3` for smooth lines.

```json
{
  "type": "line",
  "data": {
    "labels": ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
    "datasets": [
      { "label": "This Week", "data": [65,59,80,81,56,55,72], "borderColor": "rgb(75,192,192)", "tension": 0.3 },
      { "label": "Last Week", "data": [55,49,70,75,60,65,68], "borderColor": "rgb(255,99,132)", "tension": 0.3 }
    ]
  }
}
```

## Pie chart

![pie chart](/examples/05-pie-chart.png)

```json
{
  "type": "pie",
  "data": {
    "labels": ["Direct","Organic","Social","Email","Paid"],
    "datasets": [{
      "data": [120,200,150,80,100],
      "backgroundColor": ["#ff6384","#36a2eb","#ffce56","#4bc0c0","#9966ff"]
    }]
  }
}
```

## Doughnut chart

![doughnut chart](/examples/06-doughnut-chart.png)

Identical to pie + `chart.type: "doughnut"`.

```json
{
  "type": "doughnut",
  "data": {
    "labels": ["A","B","C","D"],
    "datasets": [{
      "data": [25,35,20,20],
      "backgroundColor": ["#ff6384","#36a2eb","#ffce56","#4bc0c0"]
    }]
  }
}
```

## Radar chart

![radar chart](/examples/07-radar-chart.png)

```json
{
  "type": "radar",
  "data": {
    "labels": ["Speed","Power","Endurance","Agility","Intelligence"],
    "datasets": [
      { "label": "Fighter A", "data": [85,90,75,80,70], "backgroundColor": "rgba(255,99,132,0.2)", "borderColor": "rgb(255,99,132)" },
      { "label": "Fighter B", "data": [70,75,95,85,90], "backgroundColor": "rgba(54,162,235,0.2)", "borderColor": "rgb(54,162,235)" }
    ]
  }
}
```

## Polar area chart

![polar area chart](/examples/08-polar-area-chart.png)

```json
{
  "type": "polarArea",
  "data": {
    "labels": ["Mon","Tue","Wed","Thu","Fri"],
    "datasets": [{
      "data": [11,16,7,3,14],
      "backgroundColor": ["#ff6384","#36a2eb","#ffce56","#4bc0c0","#9966ff"]
    }]
  }
}
```

## Scatter plot

![scatter plot](/examples/09-scatter-plot.png)

Datasets take `{x,y}` objects rather than values.

```json
{
  "type": "scatter",
  "data": {
    "datasets": [{
      "label": "Measurements",
      "data": [
        { "x": 10, "y": 20 },
        { "x": 15, "y": 30 },
        { "x": 20, "y": 28 },
        { "x": 25, "y": 35 }
      ],
      "backgroundColor": "rgb(255,99,132)"
    }]
  }
}
```

## Bubble chart

![bubble chart](/examples/10-bubble-chart.png)

Scatter but with radius (`r`) per point.

```json
{
  "type": "bubble",
  "data": {
    "datasets": [{
      "label": "Dataset",
      "data": [
        { "x": 20, "y": 30, "r": 15 },
        { "x": 40, "y": 10, "r": 10 },
        { "x": 30, "y": 50, "r": 25 }
      ],
      "backgroundColor": "rgba(255,99,132,0.7)"
    }]
  }
}
```

## Next

- [Composite charts](./composite) — filled area, stacked, mixed-type.
- [Labels & annotation](./decorations) — data labels and threshold lines.
- [Exotic plugins](./exotic) — treemap and beyond.
