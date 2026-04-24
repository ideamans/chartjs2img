---
title: 基本チャートタイプ
description: Bar、横棒、line、pie、doughnut、radar、polar area、scatter、bubble - Chart.js コアの 9 種類を最小のリアルな例で掲載。
---

# 基本チャートタイプ

Chart.js 組み込みの 9 タイプ。これらは全て `type: "…"` だけで動き、
プラグイン不要です。各例のタブで描画された PNG と元の JSON を
切り替えられます。

## 棒グラフ (Bar)

<Example name="bar-chart" http />

## 横棒グラフ (Horizontal Bar)

`type: "bar"` に `options.indexAxis: "y"` を加えるだけ。

<Example name="horizontal-bar-chart" http />

## 折れ線グラフ (Line)

`tension: 0.3` でスムーズな曲線。複数データセット。

<Example name="line-chart" http />

## 円グラフ (Pie)

<Example name="pie-chart" http />

## ドーナツグラフ (Doughnut)

pie と同じ構造で `type: "doughnut"`。

<Example name="doughnut-chart" http />

## レーダーチャート (Radar)

<Example name="radar-chart" http />

## ポーラーエリア (Polar Area)

<Example name="polar-area-chart" http />

## 散布図 (Scatter)

データセットには値ではなく `{x, y}` オブジェクトを渡します。

<Example name="scatter-plot" http />

## バブルチャート (Bubble)

scatter に点ごとの半径 `r` を加えたもの。

<Example name="bubble-chart" http />

## 次へ

- [複合チャート](./composite) — 塗りつぶしエリア、積み上げ、混在型。
- [ラベルと注釈](./decorations) — データラベルや閾値ライン。
- [拡張プラグイン](./exotic) — treemap とそれ以降。
