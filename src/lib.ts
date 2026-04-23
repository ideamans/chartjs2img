/**
 * chartjs2img — TypeScript / Node library entry.
 *
 * Import this file to render Chart.js configurations to images from
 * any Bun / Node program:
 *
 *     import { renderChart, closeBrowser } from 'chartjs2img'
 *
 *     const result = await renderChart({
 *       chart: { type: 'bar', data: { labels: ['A','B'], datasets: [{ data: [1,2] }] } },
 *       width: 800, height: 600, format: 'png',
 *     })
 *     await Bun.write('chart.png', result.buffer)
 *     if (result.messages.length) console.warn(result.messages)
 *     await closeBrowser() // on process shutdown
 *
 * The `chartjs2img` CLI (`src/index.ts`) and the HTTP server
 * (`src/server.ts`) share the same render pipeline but import it
 * directly from ./renderer etc. — NOT from this file. That way the
 * public surface exported here is a constraint for external consumers
 * only, and internal refactoring does not have to preserve it.
 *
 * This module intentionally **does not** export the in-memory cache
 * internals, the Puppeteer launch helpers, the HTML template, or the
 * CLI argument parser. Those are implementation details; keep your
 * dependency surface on the exports below so upgrades stay drop-in.
 */

// Core render pipeline. Most callers just need the module-level
// renderChart / closeBrowser helpers, which back onto a lazily-created
// default Renderer. Advanced callers (test harnesses, multi-tenant
// servers that want isolated browser pools, or programs that want to
// configure concurrency per-instance) can instantiate `Renderer`
// directly.
export { renderChart, closeBrowser, rendererStats, Renderer } from './renderer'
export type { RenderResult, ConsoleMessage, RendererConfig, RendererStats } from './renderer'

// Input shape.
export type { RenderOptions } from './template'

// Deterministic hash computation — useful for building a CDN-facing
// cache layer or for deduping submissions before rendering.
export { computeHash } from './cache'

// Identification. `VERSION` is the value the CLI reports and the
// X-Powered-By HTTP header surfaces.
export { VERSION, NAME } from './version'

/**
 * The exact Chart.js + plugin versions bundled into the rendering
 * page. Frozen as a reference table so callers can expose "what's
 * inside this chartjs2img?" to their own users without parsing
 * `chartjs2img llm`.
 */
export { LIBS as BUNDLED_LIBS } from './template'
