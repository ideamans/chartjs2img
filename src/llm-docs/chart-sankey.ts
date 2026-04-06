export const doc = `## chartjs-chart-sankey 0.12.1 — Sankey Flow Diagrams

Chart type: \`"sankey"\`

### Dataset Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| \`data\` | {from,to,flow}[] | **required** | Flow connections |
| \`colorFrom\` | Color | — | Source node/flow color |
| \`colorTo\` | Color | — | Target node/flow color |
| \`hoverColorFrom\` | Color | — | Source hover color |
| \`hoverColorTo\` | Color | — | Target hover color |
| \`colorMode\` | string | \`"gradient"\` | \`"gradient"\`, \`"from"\`, or \`"to"\` |
| \`alpha\` | number | \`0.5\` | Flow band transparency (0-1) |
| \`labels\` | object | — | Node ID to display name mapping |
| \`priority\` | object | — | Node ordering (lower = higher priority) |
| \`column\` | object | — | Override column placement per node |
| \`size\` | string | \`"max"\` | \`"max"\` (prevent overlap) or \`"min"\` (allow overlap) |
| \`nodeWidth\` | number | \`10\` | Width of each node bar in px |
| \`nodePadding\` | number | \`10\` | Vertical padding between nodes in px |
| \`borderWidth\` | number | \`1\` | Node border width |
| \`borderColor\` | Color | \`"black"\` | Node border color |
| \`color\` | Color | \`"black"\` | Default node color |

### Data Format

Each flow is defined by source (\`from\`), target (\`to\`), and volume (\`flow\`):

\`\`\`json
{ "data": [
  { "from": "Oil", "to": "Fossil Fuels", "flow": 15 },
  { "from": "Coal", "to": "Fossil Fuels", "flow": 25 },
  { "from": "Fossil Fuels", "to": "Energy", "flow": 40 },
  { "from": "Solar", "to": "Renewables", "flow": 10 },
  { "from": "Renewables", "to": "Energy", "flow": 10 }
]}
\`\`\`

### Labels Mapping

Map internal node IDs to display names:

\`\`\`json
{ "labels": { "Oil": "Crude Oil", "Coal": "Coal Mining", "Solar": "Solar Power" } }
\`\`\`

### Column Override

Force specific nodes into columns (0-based):

\`\`\`json
{ "column": { "Oil": 0, "Coal": 0, "Fossil Fuels": 1, "Energy": 2 } }
\`\`\`

### Example

\`\`\`json
{
  "type": "sankey",
  "data": {
    "datasets": [{
      "data": [
        { "from": "A", "to": "B", "flow": 10 },
        { "from": "A", "to": "C", "flow": 5 },
        { "from": "B", "to": "D", "flow": 10 },
        { "from": "C", "to": "D", "flow": 5 }
      ],
      "colorFrom": "#36a2eb",
      "colorTo": "#ff6384",
      "colorMode": "gradient",
      "labels": { "A": "Source", "B": "Process 1", "C": "Process 2", "D": "Output" }
    }]
  }
}
\`\`\`
`
