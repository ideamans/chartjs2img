---
title: 拡張プラグイン
description: Chart.js プラグインが必要なチャートタイプ - treemap, matrix, sankey, wordcloud, venn, graph, tree など。各々 JSON とレンダリング済み画像付き。
---

# 拡張プラグイン

これらのチャートタイプは Chart.js コアに含まれません。それぞれ専用
プラグインで追加され、全て chartjs2img に同梱されています。
下記のスニペットは `chartjs2img render` や POST `/render` にそのまま
貼り付けて使えます。

## ツリーマップ (chartjs-chart-treemap)

![treemap chart](/examples/15-treemap-chart.png)

階層ブロックを `key` プロパティのサイズで分割。

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

## マトリックス / ヒートマップ (chartjs-chart-matrix)

![matrix heatmap](/examples/19-matrix-heatmap.png)

セル毎の色を持つグリッド。JSON では「値 → 色」関数を表現できないので、
各セルに事前計算済みの色を渡す必要があります。

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

## サンキー (chartjs-chart-sankey)

![sankey flow diagram](/examples/20-sankey-flow.png)

カテゴリノード間のフロー。`flow` が各帯の幅になります。

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

## ワードクラウド (chartjs-chart-wordcloud)

![word cloud](/examples/21-word-cloud.png)

単語は `data.labels`、フォントサイズは `datasets[0].data` から取られます。

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

## ベン図 / オイラー図 (chartjs-chart-venn)

![Euler diagram, three sets](/examples/22-euler-diagram-3-set.png)

集合の重なり。標準レイアウトなら `"type": "venn"`、円のサイズと重なりを
値に比例させたいなら `"type": "euler"`。

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

## 力学モデルグラフ (chartjs-chart-graph)

![force-directed graph, microservice topology](/examples/23-force-directed-graph.png)

物理シミュレーションによるネットワークレイアウト — 座標指定不要。

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

**手動レイアウト** でグラフを描きたい場合 (ノード毎に `{x,y}` を指定) は
`"type": "graph"` を使い、`data` に座標を渡します。全オプションは
[プラグインドキュメント](https://github.com/sgratzl/chartjs-chart-graph) を参照。

## 整列ツリー (chartjs-chart-graph)

![tidy tree, 14-node org chart](/examples/24-tidy-tree.png)

ノード毎の `parent` インデックスで階層を定義するレイアウト。

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

固定深度のクラスタレイアウトなら `"type": "dendrogram"`、円形ツリーなら
`options.tree.orientation: "radial"` を指定。

## コロプレス / バブルマップ (chartjs-chart-geo)

地図系は GeoJSON をインラインで渡す必要があります (URL 読み込み機構はなし)。
Natural Earth や TopoJSON などのソースから `FeatureCollection` を取得し、
リクエストボディに埋め込んでください。

コロプレスの雛形:

```jsonc
{
  "type": "choropleth",
  "data": {
    "labels": ["France", "Germany", "Italy", "Spain"],
    "datasets": [{
      "outline": [ /* 境界計算用の GeoJSON Feature[] */ ],
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

`bubbleMap` の場合は同じ `outline` とスケール設定を保ちつつ、data を
`{ longitude, latitude, value }` の点列にします。

GeoJSON のペイロードが巨大なので、chartjs2img の既定ギャラリーには
コロプレスの描画済み画像は含めていません。独自のデータで
`/chartjs2img-render` を呼べば生成できます。

## なぜ全ての拡張タイプを載せないのか

視覚回帰を見つけやすくするため、ギャラリーは意図的に小さめにしています。
代表として treemap を載せ、他の拡張タイプは `chartjs2img llm` の標準例
(エージェントは自動で参照) と上の JSON スニペットで網羅しています。
自分のデータで試すには、スニペットを `chartjs2img render -i <file> -o out.png`
に貼り付けてください。
