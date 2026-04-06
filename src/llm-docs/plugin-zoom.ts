export const doc = `## chartjs-plugin-zoom 2.2.0 — Pan & Zoom

Configure via \`options.plugins.zoom\`.

> **Note:** In server-side rendering, zoom/pan are mainly useful for setting **initial ranges** via scale limits. Interactive zoom (wheel, drag, pinch) has no effect on static images.

### Zoom Configuration

\`\`\`json
{
  "plugins": {
    "zoom": {
      "zoom": {
        "wheel": { "enabled": false },
        "drag": { "enabled": false },
        "pinch": { "enabled": false },
        "mode": "xy"
      },
      "pan": {
        "enabled": false,
        "mode": "xy"
      },
      "limits": {
        "x": { "min": 0, "max": 100 },
        "y": { "min": 0, "max": 1000 }
      }
    }
  }
}
\`\`\`

### Pan Options (\`pan\`)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| \`enabled\` | boolean | \`false\` | Enable panning |
| \`mode\` | string | \`"xy"\` | \`"x"\`, \`"y"\`, or \`"xy"\` |
| \`modifierKey\` | string | \`null\` | Required key: \`"ctrl"\`, \`"alt"\`, \`"shift"\`, \`"meta"\` |
| \`threshold\` | number | \`10\` | Minimum pixels before panning starts |
| \`scaleMode\` | string | — | Scale-specific panning: \`"x"\`, \`"y"\`, \`"xy"\` |

### Zoom Options (\`zoom\`)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| \`mode\` | string | \`"xy"\` | Zoom directions: \`"x"\`, \`"y"\`, or \`"xy"\` |
| \`scaleMode\` | string | — | Scale-specific zoom |

**Wheel sub-options (\`zoom.wheel\`):**

| Property | Type | Default |
|----------|------|---------|
| \`enabled\` | boolean | \`false\` |
| \`speed\` | number | \`0.1\` |
| \`modifierKey\` | string | \`null\` |

**Drag sub-options (\`zoom.drag\`):**

| Property | Type | Default |
|----------|------|---------|
| \`enabled\` | boolean | \`false\` |
| \`backgroundColor\` | Color | \`"rgba(225,225,225,0.3)"\` |
| \`borderColor\` | Color | \`"rgba(225,225,225)"\` |
| \`borderWidth\` | number | \`0\` |
| \`threshold\` | number | \`0\` |
| \`modifierKey\` | string | \`null\` |
| \`drawTime\` | string | \`"beforeDatasetsDraw"\` |

**Pinch sub-options (\`zoom.pinch\`):**

| Property | Type | Default |
|----------|------|---------|
| \`enabled\` | boolean | \`false\` |

### Limits (\`limits\`)

Per-axis limits (e.g., \`limits.x\`, \`limits.y\`):

| Property | Type | Description |
|----------|------|-------------|
| \`min\` | number\\|string | Minimum scale value. \`"original"\` = initial value |
| \`max\` | number\\|string | Maximum scale value. \`"original"\` = initial value |
| \`minRange\` | number | Smallest allowed range (max zoom level) |
`
