export const doc = `## chartjs-chart-venn 4.3.3 — Venn & Euler Diagrams

Chart types: \`"venn"\`, \`"euler"\`

- **venn**: Standard Venn diagram with simple layout
- **euler**: Proportional diagram where circle sizes and overlaps reflect actual values (up to 5 sets)

### Data Format

\`\`\`json
{
  "type": "venn",
  "data": {
    "labels": ["Set A", "Set B", "A ∩ B"],
    "datasets": [{
      "label": "My Venn",
      "data": [
        { "sets": ["A"], "value": 10 },
        { "sets": ["B"], "value": 8 },
        { "sets": ["A", "B"], "value": 3 }
      ]
    }]
  }
}
\`\`\`

### Data Point Structure

| Property | Type | Description |
|----------|------|-------------|
| \`sets\` | string[] | Set identifiers. Single = individual set, multiple = intersection |
| \`value\` | number | Size of the set or intersection |

### Three-Set Example

\`\`\`json
{
  "type": "euler",
  "data": {
    "labels": ["A", "B", "C", "A∩B", "A∩C", "B∩C", "A∩B∩C"],
    "datasets": [{
      "data": [
        { "sets": ["A"], "value": 12 },
        { "sets": ["B"], "value": 10 },
        { "sets": ["C"], "value": 8 },
        { "sets": ["A", "B"], "value": 4 },
        { "sets": ["A", "C"], "value": 3 },
        { "sets": ["B", "C"], "value": 2 },
        { "sets": ["A", "B", "C"], "value": 1 }
      ],
      "backgroundColor": [
        "rgba(54,162,235,0.5)",
        "rgba(255,99,132,0.5)",
        "rgba(255,206,86,0.5)"
      ],
      "borderColor": [
        "rgba(54,162,235,1)",
        "rgba(255,99,132,1)",
        "rgba(255,206,86,1)"
      ]
    }]
  }
}
\`\`\`

### Dataset Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| \`data\` | {sets,value}[] | **required** | Set definitions |
| \`backgroundColor\` | Color\\|Color[] | — | Circle fill colors |
| \`borderColor\` | Color\\|Color[] | — | Circle border colors |
| \`borderWidth\` | number | — | Border thickness |

### Notes

- Labels in \`data.labels\` correspond to each entry in \`data\` array (sets first, then intersections)
- \`backgroundColor\` array colors correspond to individual sets only (not intersections)
- Intersection colors are automatically blended
- The \`euler\` type uses numerical optimization so circle overlaps are proportional to values
`
