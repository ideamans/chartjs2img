---
title: 拡張プラグイン
description: Chart.js プラグインで追加されるチャートタイプ - treemap を完全掲載、sankey / matrix / wordcloud / geo / graph / venn はポインタを提示。
---

# 拡張プラグイン

これらのチャートタイプは Chart.js コアに含まれません。それぞれ専用
プラグインで追加され、全て chartjs2img に同梱されています。

## ツリーマップ (Treemap)

![treemap chart](/examples/15-treemap-chart.png)

`chartjs-chart-treemap` を使用。データは `{ value, label }` のフラット配列 —
レイアウトはプラグインが行います。

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

## その他の拡張チャートタイプ

プラグイン提供のチャートタイプ一式。各々は `chartjs2img llm` の中で
オプション + JSON 例つきの専用セクションを持っています。

| `chart.type`                                           | プラグイン                  | 用途                                        |
| ------------------------------------------------------ | --------------------------- | ------------------------------------------- |
| `sankey`                                               | chartjs-chart-sankey        | カテゴリノード間のフロー図                   |
| `matrix`                                               | chartjs-chart-matrix        | ヒートマップ / セルグリッド                 |
| `wordcloud`                                            | chartjs-chart-wordcloud     | 値でサイズが決まるワードクラウド             |
| `choropleth`, `bubbleMap`                              | chartjs-chart-geo           | 地理系 choropleth / バブルマップ (要 GeoJSON) |
| `graph`, `forceDirectedGraph`, `dendrogram`, `tree`    | chartjs-chart-graph         | ネットワーク / ツリーレイアウト              |
| `venn`, `euler`                                        | chartjs-chart-venn          | 集合の交叉図                                |

プレビューするには `chartjs2img llm` を LLM にパイプして「`<type>` の
config を生成して」と依頼。各モジュールには標準の例があり、エージェントが
それを元に改造してくれます。

### なぜ全ての拡張タイプをギャラリーに載せないのか

ギャラリーを小さく保つことで、変更の度に検証できます。treemap は
拡張系の中で最もリクエストが多いので代表選手として掲載しています。
他のタイプを自分のデータでレンダリングしたければ、上流プラグインの
公式例を参照するか、chartjs2img の HTTP API で反復試行してください。
