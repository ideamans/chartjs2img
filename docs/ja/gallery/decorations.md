---
title: ラベルと注釈
description: プラグインによる装飾 - データラベル、注釈オーバーレイ、グラデーション塗り、時間軸フォーマット。
---

# ラベルと注釈

装飾系プラグイン — チャート本体は通常のものだが、その上に何かを
描き足したり、塗りを変えたりします。

## 値ラベル付き棒グラフ (chartjs-plugin-datalabels)

`chartjs-plugin-datalabels` を利用。chartjs2img では
`options.plugins.datalabels.display: true` を明示する必要があり
ます（プラグイン本来のデフォルトとは逆で、**既定は OFF**）。

<Example name="bar-with-data-labels" http />

### datalabels オプション早見表

| オプション | 主な値                                | 効果                                 |
| ---------- | ------------------------------------- | ------------------------------------ |
| `display`  | `true` / `false` / `"auto"`           | ラベル表示（上記の通り必須）         |
| `anchor`   | `"start"` / `"center"` / `"end"`      | ラベルを要素のどこに固定するか        |
| `align`    | `"top"` / `"bottom"` / `"center"` / 数値（度） | アンカーからの方向              |
| `color`    | CSS カラー                            | テキスト色                           |
| `formatter` | 関数                                 | **JSON 経由では使用不可** — 開発者ガイド参照 |

## 注釈付き折れ線 (chartjs-plugin-annotation)

`chartjs-plugin-annotation` を利用。ここでは水平の閾値線を表示。

<Example name="line-with-annotation" http />

### 使える注釈タイプ

- `"line"` — 水平 / 垂直 / 斜めの線（上の例）
- `"box"` — 塗りつぶし矩形
- `"label"` — 単独のテキスト
- `"point"` — 小さな円
- `"polygon"` — カスタム形状
- `"ellipse"` — 塗りつぶし楕円

### ボックス + ポイント注釈の組み合わせ

<Example name="annotation-box-point" http />

詳細は
[プラグインのドキュメント](https://www.chartjs.org/chartjs-plugin-annotation/)
または `chartjs2img llm` を参照。

## グラデーション塗り (chartjs-plugin-gradient)

スケール値と色の対応を書くだけで、プラグインが軸に沿って補間して
くれます — 手書き canvas コード不要。

<Example name="gradient-fill" http />

`colors` のキーは **スケール値** であってピクセル位置ではありません
。`y = 15` で色が遷移するグラデーションは、チャートのサイズが変わっ
ても正しい位置で遷移します。`line`、`bar`、`radar`、`polarArea`
のほか、`backgroundColor` や `borderColor` を使うチャート全般で
動作します。

## ズーム枠 (chartjs-plugin-zoom)

chartjs2img は静止画レンダリングなので、このプラグインのインター
アクティブな pan / zoom は使えませんが、`options.plugins.zoom.limits`
は「初期の可視範囲」を絞るために今でも有用です。

```json
{
  "type": "line",
  "data": {
    "labels": ["1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","19","20"],
    "datasets": [{
      "label": "Noisy series",
      "data": [5, 12, 8, 20, 18, 25, 30, 22, 28, 34, 40, 38, 45, 50, 48, 55, 60, 58, 65, 70],
      "borderColor": "#36a2eb",
      "tension": 0.25
    }]
  },
  "options": {
    "plugins": {
      "zoom": {
        "limits": {
          "x": { "min": 4, "max": 14 },
          "y": { "min": 15, "max": 50 }
        }
      }
    },
    "scales": {
      "x": { "min": 4, "max": 14 },
      "y": { "min": 15, "max": 50 }
    }
  }
}
```

静止画レンダリングでは通常 `scales.x.min/max` と `scales.y.min/max`
を直接指定します。zoom プラグインは後段のコードがあればその範囲を
グローバルに強制するだけです。

## 時系列軸 (chartjs-adapter-date-fns)

date-fns アダプタは事前ロード済み — `scales.x.type: "time"` で
有効化します。入力日付は ISO 文字列、ミリ秒タイムスタンプ、date-fns
がパースできる書式ならなんでも可。

<Example name="time-series-date-fns-adapter" http />

> **フォーマットトークン:** date-fns は `yyyy` / `d` を使います（Day.js の
> `YYYY` / `D` とは異なります）。`Use \`d\` instead of \`D\`` のエラーが
> 出たらトークンを入れ替えてください。

全 `time.*` オプションは
[date-fns アダプタ](https://github.com/chartjs/chartjs-adapter-date-fns)
または `chartjs2img llm` を参照。
