---
title: 複合チャート
description: 複数データセット同士または複数チャートタイプが絡むチャート - 塗りエリア、積み上げ棒、bar + line ミックス。
---

# 複合チャート

複数のデータセットが視覚的に絡むチャート、または複数のチャート
タイプが軸を共有するチャートです。

## エリアチャート (塗り線)

line チャートで `fill: true` を指定すると線の下が塗られます。

<Example name="area-chart-filled" http />

## 積み上げ棒グラフ

棒グラフで `scales.x.stacked: true` と `scales.y.stacked: true` を
指定。

<Example name="stacked-bar-chart" http />

## 混在チャート (bar + line)

データセットごとに `type:` を指定するとチャートタイプを混在
できます。親の `type:` は、個別指定がないデータセットの既定値。

<Example name="mixed-chart-bar-line" http />
