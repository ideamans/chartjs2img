export const doc = `## chartjs2img — Usage Guide for LLMs

> **Disclaimer:** This documentation may contain inaccuracies or be out of date
> with the actual Chart.js and plugin versions used by this service. If you
> encounter an error message from Chart.js during rendering, **always trust the
> error message over this documentation**. Use the error feedback mechanism
> (stderr for CLI, X-Chart-Messages header for HTTP) to diagnose and correct
> your configuration.

This service renders Chart.js configurations (JSON) into PNG or JPEG images.
All Chart.js plugins listed below are **pre-loaded** — no extra setup needed.

### Rendering Engines

Two engines are available, chosen per render via the \`engine\` field (HTTP) or
\`--engine\` flag (CLI):

- **\`skia\`** *(default)* — skia-canvas, in-process, no browser. Fast and the
  right choice for almost everything.
- **\`browser\`** — headless Chromium. Use only when you need exact real-browser
  pixel parity, or the \`chartjs-plugin-zoom\` plugin (which the \`skia\` engine
  does not include).

You normally do not need to set \`engine\` at all — the default \`skia\` renders
every supported chart type.

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
  "devicePixelRatio": 1,
  "backgroundColor": "white",
  "format": "png",
  "quality": 90,
  "engine": "skia"
}
\`\`\`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| \`chart\` | object | **required** | Chart.js configuration |
| \`width\` | number | 800 | Image width in pixels |
| \`height\` | number | 600 | Image height in pixels |
| \`devicePixelRatio\` | number | 1 | Output scale factor — N multiplies both image dimensions and rendering precision |
| \`backgroundColor\` | string | \`"white"\` | CSS color or \`"transparent"\` |
| \`format\` | string | \`"png"\` | \`"png"\` or \`"jpeg"\` |
| \`quality\` | number | 90 | JPEG quality (0-100) |
| \`engine\` | string | \`"skia"\` | Rendering engine: \`"skia"\` or \`"browser"\` |
| \`fontFamily\` | string | host default | Default chart font family; must already be installed on the host (custom fonts can only be registered via the TS library, not HTTP/CLI) |

### Error Feedback

Errors and warnings from Chart.js are captured and returned:
- **CLI**: printed to stderr as \`[chart ERROR]\` or \`[chart WARN]\`
- **HTTP**: returned in the \`X-Chart-Messages\` response header as a JSON array of \`{level, message}\`
`
