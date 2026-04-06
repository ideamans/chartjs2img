export const doc = `## chartjs-chart-matrix 2.0.1 — Heatmap / Matrix Charts

Chart type: \`"matrix"\`

### Dataset Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| \`data\` | {x,y,v}[] | **required** | Array of cell objects |
| \`label\` | string | — | Dataset identifier |
| \`backgroundColor\` | Color | — | Cell fill color |
| \`borderColor\` | Color | — | Cell border color |
| \`borderWidth\` | number | — | Border thickness |
| \`width\` | number | — | Cell width in px (also accepts function in JS, but only number in JSON) |
| \`height\` | number | — | Cell height in px (also accepts function in JS, but only number in JSON) |

### Data Format

Each data point is an object with \`x\`, \`y\` coordinates and an optional \`v\` (value):

\`\`\`json
{ "data": [
  { "x": 1, "y": 1, "v": 10 },
  { "x": 2, "y": 1, "v": 25 },
  { "x": 1, "y": 2, "v": 5 },
  { "x": 2, "y": 2, "v": 40 }
]}
\`\`\`

### Example: Heatmap

\`\`\`json
{
  "type": "matrix",
  "data": {
    "datasets": [{
      "label": "Heatmap",
      "data": [
        { "x": 1, "y": 1, "v": 5 },
        { "x": 2, "y": 1, "v": 15 },
        { "x": 3, "y": 1, "v": 25 },
        { "x": 1, "y": 2, "v": 10 },
        { "x": 2, "y": 2, "v": 30 },
        { "x": 3, "y": 2, "v": 20 }
      ],
      "backgroundColor": "rgba(54, 162, 235, 0.7)",
      "borderColor": "white",
      "borderWidth": 1,
      "width": 40,
      "height": 40
    }]
  },
  "options": {
    "scales": {
      "x": { "type": "linear", "position": "bottom", "offset": true },
      "y": { "type": "linear", "position": "left", "offset": true }
    }
  }
}
\`\`\`

> **Tip:** To create a true heatmap with color mapping, use different \`backgroundColor\` values per data point based on the \`v\` value. Since this service only accepts JSON (no functions), you must pre-compute colors for each cell.
`
