---
title: ラベルと注釈
description: 値を on-chart に表示するチャート (chartjs-plugin-datalabels) と、重ねて描く注釈線・ボックス (chartjs-plugin-annotation)。
---

# ラベルと注釈

装飾系プラグイン — チャート本体は通常のものだが、その上に何かを描き足す。

## 値ラベル付き棒グラフ

![bar with data labels](/examples/13-bar-with-data-labels.png)

`chartjs-plugin-datalabels` を使用。明示的に
`options.plugins.datalabels.display: true` を指定している点に注意 —
chartjs2img では datalabels は **既定で非表示** (プラグイン本来の既定と逆)。

```json
{
  "type": "bar",
  "data": {
    "labels": ["A","B","C","D","E"],
    "datasets": [{
      "label": "Values",
      "data": [65,59,80,81,56],
      "backgroundColor": "rgba(54,162,235,0.7)"
    }]
  },
  "options": {
    "plugins": {
      "datalabels": {
        "display": true,
        "anchor": "end",
        "align": "top",
        "color": "#333",
        "font": { "size": 12, "weight": "bold" }
      }
    },
    "layout": { "padding": { "top": 20 } }
  }
}
```

### datalabels 主要オプション

| オプション | 典型値                                | 効果                                      |
| ---------- | ------------------------------------- | ----------------------------------------- |
| `display`  | `true` / `false` / `"auto"`           | ラベル表示 (必須 — 上記参照)               |
| `anchor`   | `"start"` / `"center"` / `"end"`      | 要素上のどこにラベルを固定するか          |
| `align`    | `"top"` / `"bottom"` / `"center"` / 数値 (度) | アンカーからの方向                 |
| `color`    | CSS カラー                            | 文字色                                    |
| `formatter` | 関数                                 | **JSON では使えない** — 開発者ガイドを参照 |

## 閾値線付き折れ線

![line with annotation](/examples/14-line-with-annotation.png)

`chartjs-plugin-annotation` を使用。ここでは水平の閾値線。

```json
{
  "type": "line",
  "data": {
    "labels": ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
    "datasets": [{
      "label": "Performance",
      "data": [65,59,80,81,56,75,72],
      "borderColor": "rgb(75,192,192)",
      "tension": 0.3
    }]
  },
  "options": {
    "plugins": {
      "annotation": {
        "annotations": {
          "threshold": {
            "type": "line",
            "yMin": 70,
            "yMax": 70,
            "borderColor": "rgb(255,99,132)",
            "borderWidth": 2,
            "borderDash": [6, 6],
            "label": {
              "display": true,
              "content": "Target: 70",
              "position": "end"
            }
          }
        }
      }
    }
  }
}
```

### 使える注釈タイプ

- `"line"` — 水平 / 垂直 / 対角線 (上の例)
- `"box"` — 塗り矩形
- `"label"` — 単独テキスト
- `"point"` — 小円
- `"polygon"` — カスタム形状
- `"ellipse"` — 塗り楕円

全オプションは [プラグインドキュメント](https://www.chartjs.org/chartjs-plugin-annotation/)
または `chartjs2img llm` を参照。
