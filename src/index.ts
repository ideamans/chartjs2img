#!/usr/bin/env bun
import { startServer } from './server'
import { cliRender, cliExamples } from './cli'
import { VERSION } from './version'
import { getLlmDocs } from './llm-docs'

function printUsage(): void {
  console.log(`chartjs2img v${VERSION} - Render Chart.js charts to images using Playwright (headless Chromium)

Converts a Chart.js configuration JSON into a PNG/JPEG/WebP image. Works as an
HTTP server or a one-shot CLI. Chromium is installed automatically on first run.

COMMANDS
  chartjs2img serve [options]       Start HTTP server
  chartjs2img render [options]      Render a single chart image
  chartjs2img examples [options]    Generate all built-in example images
  chartjs2img llm                   Print extended help for LLMs (Chart.js + plugin reference)
  chartjs2img help                  Show this help

SERVE OPTIONS
  --port, -p <port>              Listen port (default: 3000, env: PORT)
  --host <host>                  Bind address (default: 0.0.0.0, env: HOST)
  --api-key <key>                Require API key auth (env: API_KEY)

RENDER OPTIONS
  --input, -i <file>             Input JSON file, or "-" for stdin (default: stdin)
  --output, -o <file>            Output image file, or "-" for stdout (default: stdout)
  --width, -w <px>               Canvas width in pixels (default: 800)
  --height, -h <px>              Canvas height in pixels (default: 600)
  --device-pixel-ratio <n>       Retina scale factor (default: 2)
  --background-color <color>     CSS color or "transparent" (default: white)
  --format, -f <fmt>             png | jpeg | webp (default: png)
  --quality, -q <0-100>          JPEG/WebP quality (default: 90)

EXAMPLES OPTIONS
  --outdir, -o <dir>             Output directory (default: ./examples)
  --format, -f <fmt>             png | jpeg (default: png)
  --quality, -q <0-100>          JPEG quality (default: 90)

ENVIRONMENT VARIABLES
  PORT                   Server listen port (default: 3000)
  HOST                   Server bind address (default: 0.0.0.0)
  API_KEY                API key for authentication (optional)
  CONCURRENCY            Max simultaneous renders (default: 8)
  CACHE_MAX_ENTRIES      Max cached images in memory (default: 1000)
  CACHE_TTL_SECONDS      Cache entry TTL in seconds (default: 3600)
  PAGE_TIMEOUT_SECONDS   Force-close orphaned browser tabs (default: 60)

HTTP ENDPOINTS (serve mode)
  POST /render           Render chart. Body: JSON (see schema below). Returns image.
  GET  /render           Same, but params via query string: ?chart={...}&width=800
  GET  /cache/<hash>     Retrieve a previously rendered image by its cache hash.
  GET  /examples         Interactive gallery page showing all built-in examples.
  GET  /health           JSON status: browser, concurrency, cache stats.

  Response headers from /render:
    X-Cache-Hash         SHA-256 hash (first 16 hex chars) of the render input
    X-Cache-Url          Full URL to GET this image from /cache/<hash>
    X-Cache-Hit          "true" if served from cache, "false" if freshly rendered
    X-Chart-Messages     JSON array of {level, message} from Chart.js (if any)

AUTHENTICATION (when API_KEY is set)
  Requests to /render and /cache must include the key in one of:
    - Header:  Authorization: Bearer <key>
    - Header:  X-API-Key: <key>
    - Query:   ?api_key=<key>
  /health and /examples are accessible without authentication.

INPUT JSON SCHEMA (for "render" CLI and POST /render)
  The input is a JSON object. For CLI "render", the top-level object IS the
  Chart.js config. For HTTP POST /render, wrap it in a "chart" field alongside
  optional render settings.

  CLI stdin/file (Chart.js config directly):
    {
      "type": "bar",
      "data": {
        "labels": ["A", "B", "C"],
        "datasets": [{ "label": "Series", "data": [10, 20, 30] }]
      },
      "options": { ... }
    }

  HTTP POST /render body:
    {
      "chart": { <Chart.js config as above> },
      "width": 800,              // optional, default 800
      "height": 600,             // optional, default 600
      "devicePixelRatio": 2,     // optional, default 2
      "backgroundColor": "white",// optional, default "white"
      "format": "png",           // optional, "png" | "jpeg" | "webp"
      "quality": 90              // optional, 0-100 for jpeg/webp
    }

CHART.JS CONFIGURATION REFERENCE
  The "chart" (or CLI input) follows the standard Chart.js config:
    {
      "type": "<chart-type>",
      "data": {
        "labels": [...],
        "datasets": [{
          "label": "...",
          "data": [...],
          "backgroundColor": "...",
          "borderColor": "...",
          ...dataset options
        }]
      },
      "options": {
        "responsive": true,            // forced true internally
        "plugins": {
          "title":      { "display": true, "text": "Title" },
          "legend":     { "position": "top" },
          "datalabels": { "display": true, "color": "#333" },
          "annotation": { "annotations": { ... } }
        },
        "scales": {
          "x": { "type": "category", "title": { "display": true, "text": "X" } },
          "y": { "type": "linear", "beginAtZero": true }
        }
      }
    }

  Supported "type" values (built-in):
    bar, line, pie, doughnut, radar, polarArea, scatter, bubble

  Additional types from plugins:
    treemap, matrix, sankey, wordcloud, choropleth, bubbleMap,
    graph, forceDirectedGraph, dendrogram, tree, venn, euler

BUILT-IN PLUGINS (all pre-loaded, no configuration needed)
  chart.js 4.4.9                    Core charting library
  chartjs-plugin-datalabels 2.2.0   Show values on chart elements
  chartjs-plugin-annotation 3.1.0   Lines, boxes, labels as overlays
  chartjs-plugin-zoom 2.2.0         Pan & zoom (initial range for static)
  chartjs-plugin-gradient 0.6.1     Gradient fills via simple config
  chartjs-chart-matrix 2.0.1        Heatmap / matrix charts
  chartjs-chart-sankey 0.12.1       Sankey flow diagrams
  chartjs-chart-treemap 2.3.1       Treemap charts
  chartjs-chart-wordcloud 4.4.3     Word cloud charts
  chartjs-chart-geo 4.3.3           Choropleth & bubble map charts
  chartjs-chart-graph 4.3.3         Network / force-directed graphs
  chartjs-chart-venn 4.3.3          Venn & Euler diagrams
  chartjs-adapter-dayjs-4 1.0.4     Day.js date adapter for time axes

  Note: animation is always forced OFF for deterministic rendering.

ERROR FEEDBACK
  Chart.js errors and warnings are captured from the browser console during
  rendering and returned to the caller. This helps diagnose invalid configs.

  CLI:
    Errors/warnings are printed to stderr:
      [chart ERROR] "nonexistent" is not a registered controller.
      [chart WARN]  Some warning message from Chart.js

  HTTP API:
    When messages exist, the response includes an X-Chart-Messages header:
      X-Chart-Messages: [{"level":"error","message":"..."},{"level":"warn","message":"..."}]

    Parse it as JSON to inspect issues:
      curl -s -D- -X POST http://localhost:3000/render \\
        -H 'Content-Type: application/json' \\
        -d '{"chart":{"type":"invalid",...}}' -o /dev/null \\
        | grep X-Chart-Messages

  Note: rendering still completes even when errors occur (the image may be
  blank or partial). Check messages to determine if the chart was valid.

USAGE EXAMPLES

  # Start server on port 3000
  chartjs2img serve

  # Start with auth and custom port
  chartjs2img serve --port 8080 --api-key s3cret

  # Render bar chart from stdin to file
  echo '{"type":"bar","data":{"labels":["A","B","C"],"datasets":[{"data":[1,2,3]}]}}' \\
    | chartjs2img render -o chart.png

  # Render from JSON file with custom size
  chartjs2img render -i config.json -o wide.png -w 1200 -h 400

  # Render as JPEG with quality setting
  chartjs2img render -i config.json -o chart.jpg -f jpeg -q 85

  # Generate all built-in examples as PNG
  chartjs2img examples -o ./gallery

  # Generate examples as JPEG
  chartjs2img examples -o ./gallery -f jpeg -q 80

  # HTTP: render via POST and save
  curl -X POST http://localhost:3000/render \\
    -H 'Content-Type: application/json' \\
    -d '{"chart":{"type":"bar","data":{"labels":["A","B"],"datasets":[{"data":[1,2]}]}}}' \\
    -o chart.png

  # HTTP: render via POST with auth and options
  curl -X POST http://localhost:3000/render \\
    -H 'Content-Type: application/json' \\
    -H 'X-API-Key: s3cret' \\
    -d '{"chart":{"type":"line","data":{"labels":["Mon","Tue","Wed"],"datasets":[{"label":"Views","data":[100,200,150],"borderColor":"#36a2eb"}]}},"width":1200,"height":400,"format":"jpeg","quality":85}' \\
    -o chart.jpg

  # HTTP: use cached image (hash from X-Cache-Hash response header)
  curl -o cached.png http://localhost:3000/cache/6b4cc4e8940fd921

  # HTTP: embed in <img> tag via GET (URL-encode the chart JSON)
  <img src="http://localhost:3000/render?chart=%7B%22type%22%3A%22pie%22%2C...%7D&width=400&height=400">

  # Check server health
  curl http://localhost:3000/health
`)
}

function parseArgs(args: string[]): Record<string, string | boolean> {
  const result: Record<string, string | boolean> = {}
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg.startsWith('--') || arg.startsWith('-')) {
      const key = arg.replace(/^-+/, '')
      const next = args[i + 1]
      if (next && !next.startsWith('-')) {
        result[key] = next
        i++
      } else {
        result[key] = true
      }
    }
  }
  return result
}

async function main(): Promise<void> {
  const command = process.argv[2]
  const args = parseArgs(process.argv.slice(3))

  if (command === '--version' || command === 'version') {
    console.log(`chartjs2img v${VERSION}`)
    process.exit(0)
  }

  if (!command || command === '--help' || command === 'help') {
    printUsage()
    process.exit(0)
  }

  if (command === 'llm') {
    console.log(getLlmDocs())
    process.exit(0)
  }

  if (command === 'serve') {
    const port = Number(args['port'] ?? args['p'] ?? process.env.PORT ?? '3000')
    const host = String(args['host'] ?? process.env.HOST ?? '0.0.0.0')
    const apiKey = String(args['api-key'] ?? process.env.API_KEY ?? '') || undefined

    await startServer({ port, host, apiKey })
  } else if (command === 'examples') {
    const outdir = (args['outdir'] as string) ?? (args['o'] as string) ?? './examples'
    const format = ((args['format'] ?? args['f']) as string) ?? 'png'
    const quality = args['quality'] ? Number(args['quality']) : args['q'] ? Number(args['q']) : undefined

    await cliExamples({
      outdir,
      format: format as 'png' | 'jpeg',
      quality,
    })
  } else if (command === 'render') {
    await cliRender({
      input: args['input'] as string ?? args['i'] as string,
      output: args['output'] as string ?? args['o'] as string,
      width: args['width'] ? Number(args['width']) : args['w'] ? Number(args['w']) : undefined,
      height: args['height'] ? Number(args['height']) : args['h'] ? Number(args['h']) : undefined,
      devicePixelRatio: args['device-pixel-ratio'] ? Number(args['device-pixel-ratio']) : undefined,
      backgroundColor: args['background-color'] as string,
      format: (args['format'] ?? args['f']) as 'png' | 'jpeg' | 'webp' | undefined,
      quality: args['quality'] ? Number(args['quality']) : args['q'] ? Number(args['q']) : undefined,
    })
  } else {
    console.error(`Unknown command: ${command}`)
    printUsage()
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
