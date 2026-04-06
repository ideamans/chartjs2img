export const doc = `## chartjs2img — Usage Guide for LLMs

> **Disclaimer:** This documentation may contain inaccuracies or be out of date
> with the actual Chart.js and plugin versions used by this service. If you
> encounter an error message from Chart.js during rendering, **always trust the
> error message over this documentation**. Use the error feedback mechanism
> (stderr for CLI, X-Chart-Messages header for HTTP) to diagnose and correct
> your configuration.

This service renders Chart.js configurations (JSON) into PNG/JPEG/WebP images.
All Chart.js plugins listed below are **pre-loaded** — no extra setup needed.

### Important Constraints

- **JSON only** — no JavaScript functions, callbacks, or code. All config must be pure JSON.
- **Animations are forced OFF** — do not set animation options; they are overridden.
- **responsive and maintainAspectRatio** are forced internally.
- All plugins are **auto-registered**. Do not add \`plugins: []\` array in the config.

### CLI Input Format

The CLI accepts a **Chart.js config object directly** as JSON:

\`\`\`json
{
  "type": "bar",
  "data": {
    "labels": ["Jan", "Feb", "Mar"],
    "datasets": [{
      "label": "Revenue",
      "data": [100, 200, 150],
      "backgroundColor": "rgba(54, 162, 235, 0.7)"
    }]
  },
  "options": {
    "plugins": {
      "title": { "display": true, "text": "Monthly Revenue" }
    }
  }
}
\`\`\`

Usage: \`echo '<json>' | chartjs2img render -o chart.png\`

### HTTP API Input Format

Wrap the Chart.js config in a \`"chart"\` field alongside optional render settings:

\`\`\`json
{
  "chart": { "type": "bar", "data": { ... }, "options": { ... } },
  "width": 800,
  "height": 600,
  "devicePixelRatio": 2,
  "backgroundColor": "white",
  "format": "png",
  "quality": 90
}
\`\`\`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| \`chart\` | object | **required** | Chart.js configuration |
| \`width\` | number | 800 | Image width in pixels |
| \`height\` | number | 600 | Image height in pixels |
| \`devicePixelRatio\` | number | 2 | Retina scaling factor |
| \`backgroundColor\` | string | \`"white"\` | CSS color or \`"transparent"\` |
| \`format\` | string | \`"png"\` | \`"png"\`, \`"jpeg"\`, or \`"webp"\` |
| \`quality\` | number | 90 | JPEG/WebP quality (0-100) |

### Error Feedback

Errors and warnings from Chart.js are captured and returned:
- **CLI**: printed to stderr as \`[chart ERROR]\` or \`[chart WARN]\`
- **HTTP**: returned in the \`X-Chart-Messages\` response header as a JSON array of \`{level, message}\`
`
