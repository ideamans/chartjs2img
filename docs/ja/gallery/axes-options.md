---
title: 軸とチャートオプション
description: デュアル軸、対数スケール、マイナス値、ラベル回転、目盛り・グリッドのカスタムスタイル - チャート種別を変えずに見た目を決める options の使い方。
---

# 軸とチャートオプション

`type` だけではプロダクション品質のチャートにはなかなか届きません。
このページは軸・目盛り・グリッドなど `options` / `scales` の代表的な
つまみを JSON だけで使い切る例を集めています。

## デュアル軸 (棒 + 折れ線 / 2 本の Y 軸)

単位が違うデータを重ねるには、各データセットに `yAxisID` を持たせ、
`options.scales` で同名のスケールを 2 本（左と右）定義します。
折れ線を最前面にしたい場合は `order` を下げます。

<Example name="dual-axis-sales-vs-conversion-rate" http />

主なポイント:

- `datasets[i].yAxisID` — スケール ID を指定
- `scales.<id>.position` — `"left"` / `"right"`
- `scales.<id>.grid.drawOnChartArea: false` — 右軸のグリッドが
  左軸のグリッドと重なって見づらくなるのを防止

## 対数スケール

値が何桁も跨ぐと、リニアスケールでは初期の年の違いが潰れます。
`scales.y.type: "logarithmic"` にすると等倍 (×2、×10) の間隔が等しく
並びます。

<Example name="log-scale-download-growth" http />

Chart.js はデフォルトで 10 進数の目盛り (1, 10, 100, …) を選びます。
カスタムしたい場合は `ticks.callback` を使いますが、chartjs2img の
JSON パイプラインでは関数値が落ちるため基本はデフォルトに任せます。

## マイナス値 (ゼロベースラインのレイアウト)

値が 0 をまたぐ場合は `suggestedMin` / `suggestedMax` で範囲を明示し、
正負で色を分ける (diverging colors) と方向が伝わります。

<Example name="negative-values-profit-loss" http />

軸の `border.color` を濃いめにしつつ、チャート内部の `grid.color`
を薄くすると 0 線が浮き上がります。

## ラベル回転

X 軸の長いカテゴリラベルは狭い幅では重なります。`ticks.maxRotation`
/ `minRotation` で傾け、`autoSkip: false` を指定すれば Chart.js が
勝手にラベルを間引きません。

<Example name="rotated-tick-labels" http />

## グリッドと目盛りのカスタムスタイル

軸周りの色・ダッシュパターン・ボーダーはすべてスケール毎に調整
できます。ブランドカラーに合わせるときや、デフォルトのグレーを
もっと控えめにしたいときに便利。

<Example name="custom-grid-tick-styling" http />

Y 軸の `tickBorderDash: [4, 4]` が破線の水平グリッドを作り、
`border.color` の単色が軸線そのものです。

## 覚えておきたいその他のスケールオプション

| オプション                                  | 効果                                                                    |
| ------------------------------------------- | ----------------------------------------------------------------------- |
| `scales.<id>.min` / `max`                   | 表示範囲をハードクランプ。外れた点はチャート領域の外に描かれます。      |
| `scales.<id>.suggestedMin` / `suggestedMax` | ヒント。Chart.js はデータに合わせて微調整します。                       |
| `scales.<id>.beginAtZero`                   | リニア軸を 0 始まりに強制。棒グラフでよく使います。                     |
| `scales.<id>.reverse`                       | 軸方向の反転（matrix の Y 軸などで）。                                  |
| `scales.<id>.stacked`                       | この軸に沿ってデータセットを積む（棒 / エリア）。                        |
| `scales.<id>.offset`                        | 点 / 棒が縁に張り付かないよう半目盛り分の余白を確保。                    |
| `scales.<id>.ticks.stepSize`                | 目盛り間隔を固定。                                                       |
| `scales.<id>.ticks.count`                   | 目盛りの概数を指定（Chart.js がキリの良い値に丸めます）。                |

完全な一覧は `chartjs2img llm` を参照してください。スケール種別
（linear / logarithmic / time / category / radialLinear）ごとに固有の
オプションが追加されます。
