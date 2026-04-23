---
title: 基本チャートタイプ
description: Bar、横棒、line、pie、doughnut、radar、polar area、scatter、bubble - Chart.js コアの 9 種類を最小のリアルな例で掲載。
---

# 基本チャートタイプ

Chart.js 組み込みの 9 タイプ。これらは全て `type: "…"` だけで動き、
プラグイン不要。

## 棒グラフ (Bar)

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

## 横棒グラフ (Horizontal Bar)

![horizontal bar chart](/examples/02-horizontal-bar-chart.png)

`type: "bar"` のまま `options.indexAxis: "y"` で横向きに。

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

## 折れ線グラフ (Line)

![line chart](/examples/03-line-chart.png)

複数データセット、`tension: 0.3` でスムージング。

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

## 円グラフ (Pie)

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

## ドーナツグラフ (Doughnut)

![doughnut chart](/examples/06-doughnut-chart.png)

円グラフの `type` を `"doughnut"` に変えるだけ。

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

## レーダーチャート (Radar)

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

## 極座標エリア (Polar Area)

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

## 散布図 (Scatter)

![scatter plot](/examples/09-scatter-plot.png)

データセットは値の配列ではなく `{x,y}` オブジェクトを取ります。

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

## バブルチャート (Bubble)

![bubble chart](/examples/10-bubble-chart.png)

散布図に半径 (`r`) を足したもの。

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

## 次

- [複合チャート](./composite) — エリア・積み上げ・ミックスタイプ。
- [ラベルと注釈](./decorations) — データラベルと閾値線。
- [拡張プラグイン](./exotic) — treemap とその先。
