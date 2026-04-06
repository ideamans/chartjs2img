export const doc = `## chartjs-chart-wordcloud 4.4.3 — Word Cloud Charts

Chart type: \`"wordCloud"\`

### Dataset Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| \`label\` | string | — | Dataset identifier |
| \`data\` | number[] | **required** | Font sizes in px for each word |

### Data Structure

Words come from \`data.labels\`, sizes come from \`datasets[].data\`:

\`\`\`json
{
  "type": "wordCloud",
  "data": {
    "labels": ["JavaScript", "Python", "Java", "TypeScript", "Go", "Rust"],
    "datasets": [{
      "data": [60, 50, 45, 40, 30, 25]
    }]
  }
}
\`\`\`

### Word Element Options

Set via \`options.elements.word\` or per-dataset:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| \`color\` | Color | — | Word text color |
| \`family\` | string | — | Font family |
| \`style\` | string | \`"normal"\` | Font style |
| \`weight\` | string | \`"normal"\` | Font weight |
| \`rotate\` | number | random | Rotation angle in degrees |
| \`rotationSteps\` | number | \`2\` | Number of rotation steps |
| \`minRotation\` | number | \`-90\` | Minimum rotation |
| \`maxRotation\` | number | \`0\` | Maximum rotation |
| \`padding\` | number | \`1\` | Padding around each word (layout spacing) |

### Controller Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| \`fit\` | boolean | \`true\` | Scale word cloud to fit chart bounds |

### Example

\`\`\`json
{
  "type": "wordCloud",
  "data": {
    "labels": ["Chart.js", "D3", "Plotly", "Recharts", "Highcharts", "Vega", "ECharts", "ApexCharts"],
    "datasets": [{
      "data": [90, 80, 60, 50, 45, 35, 70, 40],
      "color": ["#36a2eb", "#ff6384", "#ffce56", "#4bc0c0", "#9966ff", "#ff9f40", "#c9cbcf", "#7bc8a4"]
    }]
  },
  "options": {
    "elements": {
      "word": {
        "minRotation": 0,
        "maxRotation": 0,
        "padding": 3
      }
    },
    "plugins": {
      "legend": { "display": false }
    }
  }
}
\`\`\`
`
