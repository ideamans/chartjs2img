---
title: 同梱プラグイン
description: chartjs2img に同梱される 12 種類の Chart.js プラグイン - datalabels, annotation, zoom, gradient, treemap, matrix, sankey, wordcloud, geo, graph, venn, dayjs 日付アダプタ。
---

# 同梱プラグイン

chartjs2img は Chart.js コア **+ 12 プラグインエコシステム** を全て
ヘッドレスブラウザに事前ロードしています。インストール不要 —
設定 JSON でオプションを書くだけ。

各プラグインの詳細オプションは `chartjs2img llm` を実行して該当セクション
を抽出するか、下表のリンクをたどってください。

## コア

| プラグイン                                        | バージョン | 用途                                 |
| ------------------------------------------------- | --------- | ------------------------------------ |
| [chart.js](https://www.chartjs.org/)              | 4.4.9     | 全て — Chart.js 本体                 |

標準で `chart.type` に指定できる値: `bar`, `line`, `pie`, `doughnut`,
`radar`, `polarArea`, `scatter`, `bubble`。

## 装飾系

| プラグイン                                                                                  | バージョン | 用途                                    |
| ------------------------------------------------------------------------------------------- | --------- | --------------------------------------- |
| [chartjs-plugin-datalabels](https://chartjs-plugin-datalabels.netlify.app/)                 | 2.2.0     | 棒 / 点 / スライスに値を表示            |
| [chartjs-plugin-annotation](https://www.chartjs.org/chartjs-plugin-annotation/)             | 3.1.0     | 閾値線、ボックス、ラベル、ポリゴン      |
| [chartjs-plugin-zoom](https://www.chartjs.org/chartjs-plugin-zoom/)                          | 2.2.0     | 初期レンジ / ズーム設定                 |
| [chartjs-plugin-gradient](https://github.com/kurkle/chartjs-plugin-gradient)                 | 0.6.1     | canvas コードなしでグラデーション塗り   |

> **datalabels の注意:** datalabels は **既定で非表示** です。表示したい
> 場合は `options.plugins.datalabels.display: true` をチャート毎または
> データセット毎に明示してください。

## 追加チャートタイプ

| プラグイン                                                                             | バージョン | 追加される chart.type                            |
| -------------------------------------------------------------------------------------- | --------- | ------------------------------------------------ |
| [chartjs-chart-matrix](https://chartjs-chart-matrix.pages.dev/)                         | 2.0.1     | `matrix` — ヒートマップ                          |
| [chartjs-chart-sankey](https://github.com/kurkle/chartjs-chart-sankey)                  | 0.12.1    | `sankey` — 流量図                                |
| [chartjs-chart-treemap](https://chartjs-chart-treemap.pages.dev/)                       | 2.3.1     | `treemap` — 階層ブロック                         |
| [chartjs-chart-wordcloud](https://github.com/sgratzl/chartjs-chart-wordcloud)           | 4.4.3     | `wordcloud` — ワードクラウド                     |
| [chartjs-chart-geo](https://github.com/sgratzl/chartjs-chart-geo)                       | 4.3.3     | `choropleth`, `bubbleMap` — 地理系チャート       |
| [chartjs-chart-graph](https://github.com/sgratzl/chartjs-chart-graph)                   | 4.3.3     | `graph`, `forceDirectedGraph`, `dendrogram`, `tree` — ネットワーク |
| [chartjs-chart-venn](https://github.com/sgratzl/chartjs-chart-venn)                     | 4.3.3     | `venn`, `euler` — 集合図                         |

## 日付アダプタ

| プラグイン                                                                                  | バージョン | 用途                                       |
| ------------------------------------------------------------------------------------------- | --------- | ------------------------------------------ |
| [chartjs-adapter-dayjs-4](https://github.com/sgratzl/chartjs-adapter-dayjs-4)                | 1.0.4     | 時間軸 (`scales.x.type: "time"`) に必須    |

## 同梱されていないもの

- **アニメーション** — `options.animation` は内部で常に OFF。レンダラは
  最終フレームを安定して撮影する必要があるため、アニメーションは中途
  半端なフレームで切り取られてしまいます。
- **持ち込みの自作プラグイン** — ブラウザが実行するのはページ初期化時に
  ロードされる上記プラグインのみ。追加するには開発者ガイド
  [Chart.js プラグインの追加](/ja/developer/adding-plugin) を参照。

## レンダー時の強制 / 上書き

Chart.js プラグインは通常 `options.plugins.<name>` で有効化できます。
データセット毎の上書き (例: `datalabels`) は各プラグインの公式ドキュメント
を参照。`chartjs2img llm` には全同梱プラグインの完全オプションツリーが
含まれます。
