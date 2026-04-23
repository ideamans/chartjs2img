---
title: Labels & annotation
description: Charts with on-chart values (chartjs-plugin-datalabels) and overlayed annotation lines / boxes (chartjs-plugin-annotation).
---

# Labels & annotation

Decorator plugins — the chart shape is ordinary, but something is
drawn on top of it.

## Bar with data labels

![bar with data labels](/examples/13-bar-with-data-labels.png)

Uses `chartjs-plugin-datalabels`. Note the explicit
`options.plugins.datalabels.display: true` — datalabels is **off by
default** in chartjs2img (opposite of the plugin's own default).

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

### datalabels options recap

| Option    | Typical values                     | Effect                                    |
| --------- | ---------------------------------- | ----------------------------------------- |
| `display` | `true` / `false` / `"auto"`        | Show labels (required — see above)        |
| `anchor`  | `"start"` / `"center"` / `"end"`   | Where on the element the label is anchored |
| `align`   | `"top"` / `"bottom"` / `"center"` / number (degrees) | Direction from anchor |
| `color`   | CSS color                          | Text color                                |
| `formatter` | function                         | **Not usable over JSON** — see Developer Guide |

## Line with annotation

![line with annotation](/examples/14-line-with-annotation.png)

Uses `chartjs-plugin-annotation`. Here a horizontal threshold line.

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

### Annotation types you can use

- `"line"` — horizontal / vertical / diagonal line (what's shown above)
- `"box"` — filled rectangle
- `"label"` — standalone text
- `"point"` — small circle
- `"polygon"` — custom shape
- `"ellipse"` — filled ellipse

See the [plugin docs](https://www.chartjs.org/chartjs-plugin-annotation/)
or `chartjs2img llm` for all options.
