---
title: 拡張プラグイン
description: Chart.js プラグインが必要なチャートタイプ - treemap, matrix, sankey, wordcloud, venn, graph, tree など。各々 JSON とレンダリング済み画像付き。
---

# 拡張プラグイン

これらのチャートタイプは Chart.js コアに含まれません。それぞれ
専用プラグインで追加され、全て chartjs2img に同梱されています。
各例のタブで PNG・JSON・CLI / HTTP コマンドを切り替えられます。

## ツリーマップ (chartjs-chart-treemap)

`tree` の値に応じてサイズされる階層ブロック。

<Example name="treemap-chart" http />

## マトリクス / ヒートマップ (chartjs-chart-matrix)

離散セルのグリッドに色を塗ります。JSON では値 → 色の関数を表現できない
ので、セル毎の色を事前計算しておきます。

<Example name="matrix-heatmap" http />

## サンキー (chartjs-chart-sankey)

カテゴリ間の流量。`flow` が各バンドの幅。

<Example name="sankey-flow" http />

## ワードクラウド (chartjs-chart-wordcloud)

単語は `data.labels`、フォントサイズは `datasets[0].data` から。

<Example name="word-cloud" http />

## Venn / Euler (chartjs-chart-venn)

集合の重なり。通常配置は `"type": "venn"`、円サイズと重なりを値に
比例させたい場合は `"type": "euler"`。

<Example name="euler-diagram-3-set" http />

## 力学モデルグラフ (chartjs-chart-graph)

物理シミュレーションによるネットワークレイアウト。座標不要。

<Example name="force-directed-graph" http />

**手動配置** のグラフが欲しい場合は `"type": "graph"` を使い、
`data` に `{x, y}` を指定します。全オプションは
[プラグインドキュメント](https://github.com/sgratzl/chartjs-chart-graph)
を参照。

## ツリー (chartjs-chart-graph)

`parent` インデックスで階層を表現。

<Example name="tidy-tree" http />

固定深度のクラスタレイアウトが欲しければ `"type": "dendrogram"`、
円形ツリーは `options.tree.orientation: "radial"`。

## Choropleth / バブルマップ (chartjs-chart-geo)

地理マップは URL 読み込み機構がないため、GeoJSON をインラインで
渡します。Natural Earth や TopoJSON などから `FeatureCollection` を
取得してリクエストボディに含めます。

Choropleth の骨格:

```jsonc
{
  "type": "choropleth",
  "data": {
    "labels": ["France", "Germany", "Italy", "Spain"],
    "datasets": [{
      "outline": [ /* 境界用の GeoJSON Feature[] */ ],
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

`bubbleMap` の場合は同じ `outline` / スケール設定のまま、データを
`{ longitude, latitude, value }` の点として渡します。

GeoJSON ペイロードが大きいので、chartjs2img の既定ギャラリーには
レンダリング済み choropleth を同梱していません。自前のデータで
`/chartjs2img-render` に投げれば出力できます。

## なぜ全ての拡張型を掲載しないのか

ギャラリーは視覚回帰を目視できるよう意図的に小さく保っています。
レンダリング済み例が各プラグインの主要レイアウトスタイルをカバー
しており、その他のバリエーションは `chartjs2img llm` の正規例
（エージェントが自動で読み取る）と上記の JSON スニペットで押さえ
ています。自分のデータでプレビューしたい場合はスニペットを
`chartjs2img render -i <file> -o out.png` に貼り付けてください。
