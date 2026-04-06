export const doc = `## chartjs-chart-graph 4.3.3 — Network & Tree Graphs

Chart types: \`"graph"\`, \`"forceDirectedGraph"\`, \`"dendrogram"\`, \`"tree"\`

### Common Dataset Properties

| Property | Type | Description |
|----------|------|-------------|
| \`data\` | object[] | Node objects |
| \`edges\` | {source,target}[] | Edge connections (by array index) |
| \`labels\` | string[] | Node labels |

### Node Styling

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| \`pointBackgroundColor\` | Color | — | Node fill color |
| \`pointBorderColor\` | Color | — | Node border color |
| \`pointRadius\` | number | \`3\` | Node size in px |
| \`pointStyle\` | string | \`"circle"\` | Node shape |

### Edge Styling

Set via \`options.elements.edge\` or per-dataset:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| \`borderColor\` | Color | — | Edge color |
| \`borderWidth\` | number | — | Edge width |

### graph (Manual Layout)

Nodes require explicit \`x\`, \`y\` coordinates:

\`\`\`json
{
  "type": "graph",
  "data": {
    "labels": ["A", "B", "C"],
    "datasets": [{
      "data": [
        { "x": 0, "y": 0 },
        { "x": 100, "y": 50 },
        { "x": 50, "y": 100 }
      ],
      "edges": [
        { "source": 0, "target": 1 },
        { "source": 1, "target": 2 },
        { "source": 2, "target": 0 }
      ],
      "pointRadius": 8,
      "pointBackgroundColor": "#36a2eb"
    }]
  }
}
\`\`\`

### forceDirectedGraph (Auto Layout)

Nodes are positioned by physics simulation. No coordinates needed:

\`\`\`json
{
  "type": "forceDirectedGraph",
  "data": {
    "labels": ["A", "B", "C", "D", "E"],
    "datasets": [{
      "data": [{}, {}, {}, {}, {}],
      "edges": [
        { "source": 0, "target": 1 },
        { "source": 0, "target": 2 },
        { "source": 1, "target": 3 },
        { "source": 2, "target": 4 }
      ],
      "pointRadius": 10,
      "pointBackgroundColor": "#36a2eb"
    }]
  }
}
\`\`\`

#### Simulation Options

Set via \`options.simulation\` (or dataset \`simulation\`):

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| \`autoRestart\` | boolean | \`true\` | Restart on data change |
| \`initialIterations\` | number | — | Pre-render iterations (higher = more stable layout) |
| \`forces.center\` | object | enabled | Centering force: \`{x, y}\` |
| \`forces.collide\` | object | disabled | Collision: \`{radius, strength}\` |
| \`forces.link\` | object | enabled | Spring: \`{distance, strength}\` |
| \`forces.manyBody\` | object | enabled | Repulsion: \`{strength, theta, distanceMin, distanceMax}\` |
| \`forces.x\` | object | disabled | X pull: \`{x, strength}\` |
| \`forces.y\` | object | disabled | Y pull: \`{y, strength}\` |
| \`forces.radial\` | object | disabled | Circular: \`{radius, x, y, strength}\` |

### dendrogram (Hierarchical Cluster)

Uses \`parent\` index to define hierarchy:

\`\`\`json
{
  "type": "dendrogram",
  "data": {
    "labels": ["Root", "A", "B", "A1", "A2", "B1"],
    "datasets": [{
      "data": [
        {},
        { "parent": 0 },
        { "parent": 0 },
        { "parent": 1 },
        { "parent": 1 },
        { "parent": 2 }
      ],
      "pointRadius": 6,
      "pointBackgroundColor": "#36a2eb"
    }]
  }
}
\`\`\`

### tree (Tidy Tree)

Same structure as dendrogram, different layout algorithm:

\`\`\`json
{ "type": "tree" }
\`\`\`

### Tree/Dendrogram Options

Set via \`options.tree\` or \`dataset.tree\`:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| \`orientation\` | string | \`"horizontal"\` | \`"horizontal"\`, \`"vertical"\`, \`"radial"\` |
`
