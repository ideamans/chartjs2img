---
title: ラベルと注釈
description: プラグインによる装飾 - データラベル、注釈オーバーレイ、グラデーション塗り、ズームフレーミング、時間軸。
---

# ラベルと注釈

装飾系プラグイン — チャート本体は通常のものだが、その上に何かを描き足したり、
塗りを変えたりします。

## 値ラベル付き棒グラフ (chartjs-plugin-datalabels)

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

## 閾値線付き折れ線 (chartjs-plugin-annotation)

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

### ボックス + ポイント注釈の併用

![line with box and point annotations](/examples/27-annotation-box-point.png)

```json
{
  "type": "line",
  "data": {
    "labels": ["Jan","Feb","Mar","Apr","May","Jun"],
    "datasets": [{
      "label": "Signups",
      "data": [120, 180, 220, 310, 290, 410],
      "borderColor": "#36a2eb",
      "tension": 0.3
    }]
  },
  "options": {
    "plugins": {
      "annotation": {
        "annotations": {
          "launchWindow": {
            "type": "box",
            "xMin": 2,
            "xMax": 3,
            "backgroundColor": "rgba(255, 206, 86, 0.15)",
            "borderColor": "rgba(255, 206, 86, 0.8)",
            "borderWidth": 1,
            "label": {
              "display": true,
              "content": "Launch",
              "position": { "x": "center", "y": "start" }
            }
          },
          "peak": {
            "type": "point",
            "xValue": 5,
            "yValue": 410,
            "radius": 8,
            "backgroundColor": "rgba(255, 99, 132, 0.8)",
            "borderColor": "rgba(255, 99, 132, 1)",
            "borderWidth": 2
          }
        }
      }
    }
  }
}
```

全オプションは [プラグインドキュメント](https://www.chartjs.org/chartjs-plugin-annotation/)
または `chartjs2img llm` を参照。

## グラデーション塗り (chartjs-plugin-gradient)

![line with Y-axis gradient fill and stroke](/examples/25-gradient-fill.png)

スケール値を色にマッピングして軸方向に補間 — canvas コード不要。

```json
{
  "type": "line",
  "data": {
    "labels": ["0","1","2","3","4","5","6","7","8","9","10"],
    "datasets": [{
      "label": "Temperature",
      "data": [5, 8, 12, 15, 20, 26, 30, 28, 24, 18, 12],
      "fill": true,
      "borderWidth": 2,
      "tension": 0.35,
      "gradient": {
        "backgroundColor": {
          "axis": "y",
          "colors": {
            "0":   "rgba(54, 162, 235, 0.0)",
            "15":  "rgba(54, 162, 235, 0.4)",
            "30":  "rgba(255, 99, 132, 0.6)"
          }
        },
        "borderColor": {
          "axis": "y",
          "colors": {
            "0":  "#36a2eb",
            "15": "#ffce56",
            "30": "#ff6384"
          }
        }
      }
    }]
  },
  "options": {
    "scales": { "y": { "beginAtZero": true } }
  }
}
```

`colors` のキーは **スケール値** (ピクセル位置ではない) なので、チャートが
リサイズされても `y = 15` でのトランジションは正しい位置を保ちます。
`line`、`bar`、`radar`、`polarArea`、そして `backgroundColor` /
`borderColor` を使うチャート全般で動きます。

## ズームによるフレーミング (chartjs-plugin-zoom)

chartjs2img は静止画を描画するので、このプラグインのインタラクティブな
pan/zoom はそのままでは効きません — しかし `options.plugins.zoom.limits`
は、混雑したチャートの **初期可視レンジ** をクランプする用途で有用です。

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

静的レンダーでは通常 `scales.x.min/max` と `scales.y.min/max` を直接設定
します。zoom プラグインは下流コードがそれらの境界を必要とする場合に
グローバルに強制します。

## 時間軸 (chartjs-adapter-date-fns)

![time-series line chart with daily data](/examples/26-time-series-date-fns-adapter.png)

date-fns アダプタは事前ロード済み — `scales.x.type: "time"` で有効化。
入力日付は ISO 文字列、ミリ秒タイムスタンプ、または date-fns がパースできる
形式を指定できます。

```json
{
  "type": "line",
  "data": {
    "datasets": [{
      "label": "Daily sales",
      "data": [
        { "x": "2024-01-01", "y": 100 },
        { "x": "2024-01-02", "y": 150 },
        { "x": "2024-01-03", "y": 120 },
        { "x": "2024-01-04", "y": 200 },
        { "x": "2024-01-05", "y": 180 },
        { "x": "2024-01-08", "y": 230 },
        { "x": "2024-01-09", "y": 210 },
        { "x": "2024-01-10", "y": 260 }
      ],
      "borderColor": "#36a2eb",
      "backgroundColor": "rgba(54, 162, 235, 0.15)",
      "fill": true,
      "tension": 0.3
    }]
  },
  "options": {
    "plugins": { "legend": { "position": "top" } },
    "scales": {
      "x": {
        "type": "time",
        "time": {
          "unit": "day",
          "displayFormats": { "day": "MMM d" },
          "tooltipFormat": "yyyy-MM-dd"
        },
        "title": { "display": true, "text": "Date" }
      },
      "y": { "beginAtZero": true }
    }
  }
}
```

> **フォーマットトークン:** date-fns は `yyyy` / `d` (Day.js の `YYYY` /
> `D` ではない)。Chart.js が `Use d instead of D` エラーを出したら、
> トークンを date-fns 形式に書き換えてください。

全 `time.*` オプションは [date-fns アダプタ](https://github.com/chartjs/chartjs-adapter-date-fns)
または `chartjs2img llm` を参照。
