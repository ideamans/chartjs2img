export const doc = `## chartjs-chart-geo 4.3.3 — Choropleth & Bubble Map Charts

Chart types: \`"choropleth"\`, \`"bubbleMap"\`

> **Note:** GeoJSON feature data must be provided inline in the JSON config. You can obtain GeoJSON from sources like Natural Earth or TopoJSON. The features must be included directly in the dataset \`data\` array — there is no URL-loading mechanism.

### Choropleth Chart

Renders colored regions based on values.

#### Dataset Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| \`data\` | {feature,value}[] | **required** | GeoJSON features with values |
| \`outline\` | GeoJSON Feature[] | — | Features used to compute map bounds |
| \`showOutline\` | boolean | \`false\` | Display outline border |
| \`backgroundColor\` | Color | — | Default fill color |
| \`borderColor\` | Color | — | Region border color |
| \`borderWidth\` | number | — | Border thickness |

#### Data Format

\`\`\`json
{
  "data": [
    { "feature": { "type": "Feature", "geometry": { ... }, "properties": { "name": "France" } }, "value": 67 },
    { "feature": { "type": "Feature", "geometry": { ... }, "properties": { "name": "Germany" } }, "value": 83 }
  ]
}
\`\`\`

#### Scales

| Scale ID | Type | Key Options |
|----------|------|-------------|
| \`projection\` (or \`x\`) | \`"projection"\` | \`projection\`: map projection type |
| \`color\` (or \`y\`) | \`"color"\` | \`quantize\`: number of discrete color steps |

Projection types: \`"albersUsa"\`, \`"equalEarth"\`, \`"equirectangular"\`, \`"naturalEarth1"\`, \`"mercator"\`, \`"albers"\`, \`"azimuthalEqualArea"\`, \`"azimuthalEquidistant"\`, \`"conicConformal"\`, \`"conicEqualArea"\`, \`"conicEquidistant"\`, \`"gnomonic"\`, \`"orthographic"\`, \`"stereographic"\`, \`"transverseMercator"\`

#### Scale Configuration

\`\`\`json
{
  "scales": {
    "projection": {
      "axis": "x",
      "projection": "equalEarth"
    },
    "color": {
      "axis": "x",
      "quantize": 5,
      "display": false
    }
  }
}
\`\`\`

### BubbleMap Chart

Renders bubbles at geographic coordinates.

#### Data Format

\`\`\`json
{
  "data": [
    { "longitude": 2.35, "latitude": 48.86, "value": 2161 },
    { "longitude": 13.4, "latitude": 52.52, "value": 3645 }
  ]
}
\`\`\`

| Property | Type | Description |
|----------|------|-------------|
| \`longitude\` | number | Longitude coordinate |
| \`latitude\` | number | Latitude coordinate |
| \`value\` | number | Maps to bubble radius |

#### Dataset Properties (BubbleMap)

Same as choropleth for \`outline\`, \`showOutline\`. Data points use \`{longitude, latitude, value}\` instead of \`{feature, value}\`.
`
