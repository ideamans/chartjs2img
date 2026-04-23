---
title: 複合チャート
description: 複数データセット同士または複数チャートタイプが絡むチャート - 塗りエリア、積み上げ棒、bar + line ミックス。
---

# 複合チャート

複数のデータセットが視覚的に絡むチャート、または複数のチャートタイプが
軸を共有するチャート。

## エリアチャート (塗り線)

![area chart filled](/examples/04-area-chart-filled.png)

line チャートで `fill: true` を指定すると線の下が塗られます。

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

## 積み上げ棒グラフ

![stacked bar chart](/examples/12-stacked-bar-chart.png)

`scales.x.stacked: true` と `scales.y.stacked: true` を併用。

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

## ミックスチャート (bar + line)

![mixed chart bar line](/examples/11-mixed-chart-bar-line.png)

データセット毎に `type:` を指定してチャートタイプを混ぜる。親の `type:` は
独自 `type` を持たないデータセットのデフォルトに過ぎない。

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
