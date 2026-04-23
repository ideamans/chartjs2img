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

## Choropleth (chartjs-chart-geo)

地理マップは URL 読み込みが使えず、GeoJSON をインラインで渡します。
このギャラリー例は 3 × 2 の抽象グリッドをポリゴン 6 個で構成し、
設定が読みやすく収まる最小の形にしています。実地図を描くときは
Natural Earth や TopoJSON の FeatureCollection を `outline` に
そのまま入れれば OK。

<Example name="choropleth-abstract-grid" http />

主要な型:

- `datasets[i].outline` — 地図の境界を表す GeoJSON `Feature` 配列
  （`showOutline: true` のときはアウトラインの描画にも使われる）
- `datasets[i].data[i]` — `{ feature, value }`。`feature` の内側が
  塗られ、`value` がカラースケールを駆動
- `options.scales.projection` —
  [d3-geo projection](https://github.com/d3/d3-geo#projections) 名
- `options.scales.color.interpolate` — d3 のインターポレータ名
  (`"blues"`、`"viridis"`、`"reds"` …)

## バブルマップ (chartjs-chart-geo)

同じプラグインで、`outline` も同じですが、データは
`{longitude, latitude, value}` 点列です。バブルの半径は `value`
から `size` スケール経由で決まります。

<Example name="bubble-map-abstract-grid" http />

抽象 outline を実地の FeatureCollection に差し替えれば、バブル
位置は現実の地理に揃います。データセットが多い地図（地域ごとに
1 シリーズなど）は複数の `datasets` を定義し、各々が同じ
`outline` を共有する形にします。

> **ペイロード Tips:** 実地 TopoJSON は数百 KB になりがちです。
> HTTP クライアントから使うときは `GET /render?chart=…` ではなく
> POST を推奨。URL 長制限のほうが JSON ボディ制限より先に当たる
> ためです。

## なぜ全ての拡張型を掲載しないのか

ギャラリーは視覚回帰を目視できるよう意図的に小さく保っています。
レンダリング済み例が各プラグインの主要レイアウトスタイルをカバー
しており、その他のバリエーションは `chartjs2img llm` の正規例
（エージェントが自動で読み取る）と上記の JSON スニペットで押さえ
ています。自分のデータでプレビューしたい場合はスニペットを
`chartjs2img render -i <file> -o out.png` に貼り付けてください。
