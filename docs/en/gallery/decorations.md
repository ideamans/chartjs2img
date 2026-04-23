---
title: Labels & annotation
description: Charts decorated by plugins - data labels, annotation overlays, gradient fills, and zoom/pan framing.
---

# Labels & annotation

Decorator plugins — the chart shape is ordinary, but something is
drawn on top of it (or applied as a fill).

## Bar with data labels (chartjs-plugin-datalabels)

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

## Line with annotation (chartjs-plugin-annotation)

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

### Box + point annotations combined

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

See the [plugin docs](https://www.chartjs.org/chartjs-plugin-annotation/)
or `chartjs2img llm` for all options.

## Gradient fills (chartjs-plugin-gradient)

![line with Y-axis gradient fill and stroke](/examples/25-gradient-fill.png)

Map scale values to colors and the plugin interpolates along an axis —
no manual canvas code required.

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

Keys in `colors` are **scale values**, not pixel positions — so a
gradient that transitions at `y = 15` stays correct even if the chart
is resized. Works with `line`, `bar`, `radar`, `polarArea`, and any
chart using `backgroundColor` / `borderColor`.

## Zoom framing (chartjs-plugin-zoom)

chartjs2img renders static images, so the interactive pan/zoom of
this plugin doesn't apply — but the plugin's `options.plugins.zoom.limits`
is still useful for clamping the **initial** visible range of a
crowded chart.

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

For static rendering you typically set `scales.x.min/max` and
`scales.y.min/max` directly; the zoom plugin simply enforces those
bounds globally if downstream code ever needs them.

## Time-series axis (chartjs-adapter-date-fns)

![time-series line chart with daily data](/examples/26-time-series-date-fns-adapter.png)

The date-fns adapter is pre-loaded — set `scales.x.type: "time"` to
enable it. Input dates can be ISO strings, millisecond timestamps, or
anything date-fns can parse.

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

> **Format tokens:** date-fns uses `yyyy` / `d` (not Day.js's `YYYY` /
> `D`). If Chart.js throws `Use \`d\` instead of \`D\``, swap the tokens.

See the [date-fns adapter](https://github.com/chartjs/chartjs-adapter-date-fns)
or `chartjs2img llm` for every `time.*` option.
