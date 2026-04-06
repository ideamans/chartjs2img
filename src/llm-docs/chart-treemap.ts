export const doc = `## chartjs-chart-treemap 2.3.1 — Treemap Charts

Chart type: \`"treemap"\`

### Dataset Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| \`tree\` | number[]\\|object[] | **required** | Source data |
| \`key\` | string | — | Property name for numerical values (when \`tree\` is object[]) |
| \`groups\` | string[] | — | Hierarchy grouping keys (e.g., \`["category", "subcategory"]\`) |
| \`sumKeys\` | string[] | — | Additional keys to aggregate |
| \`treeLeafKey\` | string | \`"_leaf"\` | Key identifying leaf nodes |
| \`label\` | string | — | Dataset label |
| \`backgroundColor\` | Color | — | Rectangle fill color |
| \`borderColor\` | Color | — | Rectangle border color |
| \`borderWidth\` | number\\|object | \`0\` | Border width |
| \`borderRadius\` | number | \`0\` | Corner radius |
| \`spacing\` | number | \`0.5\` | Gap between rectangles (px) |

### Labels (inside rectangles)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| \`labels.display\` | boolean | \`false\` | Show labels |
| \`labels.align\` | string | \`"center"\` | Horizontal alignment |
| \`labels.position\` | string | \`"middle"\` | Vertical position |
| \`labels.color\` | Color\\|Color[] | \`"black"\` | Text color |
| \`labels.font\` | Font\\|Font[] | — | Font config |
| \`labels.overflow\` | string | \`"cut"\` | \`"cut"\`, \`"hidden"\`, \`"fit"\` |
| \`labels.padding\` | number | \`3\` | Padding |

### Captions (group headers)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| \`captions.display\` | boolean | \`true\` | Show group captions |
| \`captions.align\` | string | — | Text alignment |
| \`captions.color\` | Color | \`"black"\` | Text color |
| \`captions.font\` | Font | — | Font config |
| \`captions.padding\` | number | \`3\` | Padding |

### Dividers (between groups)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| \`dividers.display\` | boolean | \`false\` | Show dividers |
| \`dividers.lineColor\` | Color | \`"black"\` | Line color |
| \`dividers.lineWidth\` | number | \`1\` | Line width |
| \`dividers.lineDash\` | number[] | \`[]\` | Dash pattern |

### Example: Flat Data

\`\`\`json
{
  "type": "treemap",
  "data": {
    "datasets": [{
      "tree": [15, 6, 6, 5, 4, 3, 2, 2],
      "backgroundColor": ["#36a2eb", "#ff6384", "#ffce56", "#4bc0c0", "#9966ff", "#ff9f40", "#c9cbcf", "#7bc8a4"],
      "borderWidth": 1,
      "borderColor": "white",
      "labels": {
        "display": true,
        "color": "white",
        "font": { "weight": "bold" }
      }
    }]
  }
}
\`\`\`

### Example: Grouped Object Data

\`\`\`json
{
  "type": "treemap",
  "data": {
    "datasets": [{
      "tree": [
        { "category": "A", "sub": "x", "value": 10 },
        { "category": "A", "sub": "y", "value": 20 },
        { "category": "B", "sub": "x", "value": 15 },
        { "category": "B", "sub": "y", "value": 5 }
      ],
      "key": "value",
      "groups": ["category", "sub"],
      "backgroundColor": "#36a2eb",
      "borderWidth": 2,
      "borderColor": "white",
      "captions": { "display": true, "color": "black" },
      "labels": { "display": true, "color": "white" }
    }]
  }
}
\`\`\`
`
