export const doc = `## chartjs-plugin-gradient 0.6.1 — Gradient Fills

Configure per-dataset via a \`gradient\` property.

### Dataset Configuration

\`\`\`json
{
  "datasets": [{
    "label": "Gradient Line",
    "data": [10, 25, 50, 75, 100],
    "borderColor": "blue",
    "gradient": {
      "backgroundColor": {
        "axis": "y",
        "colors": {
          "0": "rgba(54, 162, 235, 0.0)",
          "50": "rgba(54, 162, 235, 0.5)",
          "100": "rgba(54, 162, 235, 1.0)"
        }
      },
      "borderColor": {
        "axis": "x",
        "colors": {
          "0": "red",
          "100": "blue"
        }
      }
    }
  }]
}
\`\`\`

### Options

| Property | Type | Description |
|----------|------|-------------|
| \`gradient.backgroundColor.axis\` | \`"x"\\|"y"\` | Gradient direction for fill |
| \`gradient.backgroundColor.colors\` | object | Map of scale value to CSS color |
| \`gradient.borderColor.axis\` | \`"x"\\|"y"\` | Gradient direction for stroke |
| \`gradient.borderColor.colors\` | object | Map of scale value to CSS color |

The keys in \`colors\` correspond to **scale values** (not pixel positions). The plugin interpolates colors between defined stops along the specified axis.

### Supported Chart Types

Works with: \`line\`, \`bar\`, \`radar\`, \`polarArea\`, and any type that uses \`backgroundColor\` or \`borderColor\`.
`
