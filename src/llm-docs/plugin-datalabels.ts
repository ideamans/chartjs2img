export const doc = `## chartjs-plugin-datalabels 2.2.0 — Display Values on Chart Elements

Configure globally via \`options.plugins.datalabels\` or per-dataset via \`dataset.datalabels\`.

> **Note:** In this service, all option values must be JSON-serializable. Function-based (scriptable) options are not available.

### Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| \`display\` | boolean\\|string | \`true\` | Show labels. Set \`"auto"\` to hide overlapping labels |
| \`align\` | string\\|number | \`"center"\` | Label position: \`"center"\`, \`"start"\`, \`"end"\`, \`"right"\`, \`"bottom"\`, \`"left"\`, \`"top"\`, or degrees (0-360) |
| \`anchor\` | string | \`"center"\` | Anchor point on the element: \`"center"\`, \`"start"\`, \`"end"\` |
| \`offset\` | number | \`4\` | Distance (px) from anchor point |
| \`rotation\` | number | \`0\` | Label rotation in degrees |
| \`clamp\` | boolean | \`false\` | Keep label within chart area |
| \`clip\` | boolean | \`false\` | Clip label to chart area |
| \`opacity\` | number | \`1\` | Label opacity (0-1) |

### Text Styling

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| \`color\` | Color | Chart.defaults.color | Text color |
| \`font\` | Font | inherits from Chart.js defaults | Font: \`{family, size, style, weight, lineHeight}\`. Default weight: \`"normal"\`, lineHeight: \`1.2\` |
| \`textAlign\` | string | \`"start"\` | Multi-line alignment: \`"start"\`, \`"center"\`, \`"end"\` |
| \`textStrokeColor\` | Color | inherits from \`color\` | Text stroke (outline) color |
| \`textStrokeWidth\` | number | \`0\` | Text stroke width |
| \`textShadowBlur\` | number | \`0\` | Text shadow blur radius |
| \`textShadowColor\` | Color | inherits from \`color\` | Text shadow color |

### Background & Border

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| \`backgroundColor\` | Color\\|null | \`null\` | Label background color |
| \`borderColor\` | Color\\|null | \`null\` | Label border color |
| \`borderRadius\` | number | \`0\` | Border corner radius |
| \`borderWidth\` | number | \`0\` | Border width |
| \`padding\` | number\\|object | \`4\` | Inner padding. Number or \`{top, right, bottom, left}\` |

### Multiple Labels

Use \`labels\` to show multiple labels per data point:

\`\`\`json
{
  "plugins": {
    "datalabels": {
      "labels": {
        "value": {
          "color": "blue",
          "font": { "weight": "bold" }
        },
        "name": {
          "color": "gray",
          "align": "top",
          "font": { "size": 10 }
        }
      }
    }
  }
}
\`\`\`

### Example

\`\`\`json
{
  "type": "bar",
  "data": {
    "labels": ["A", "B", "C"],
    "datasets": [{
      "data": [10, 20, 15],
      "backgroundColor": ["#36a2eb", "#ff6384", "#ffce56"]
    }]
  },
  "options": {
    "plugins": {
      "datalabels": {
        "display": true,
        "color": "#333",
        "anchor": "end",
        "align": "top",
        "font": { "weight": "bold", "size": 14 }
      }
    }
  }
}
\`\`\`
`
