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

// Input shape + engine selection. The default engine is skia-canvas
// (`DEFAULT_ENGINE`); pass `engine: 'browser'` per render for headless
// Chromium when maximum fidelity is required.
export type { RenderOptions, Engine } from './template'
export { DEFAULT_ENGINE } from './template'

// ---------------------------------------------------------------------------
// Custom fonts (skia engine)
// ---------------------------------------------------------------------------
//
// Bring your own fonts — e.g. an @fontsource/* package — and render without
// relying on system fonts. Register the family here, then name it via the
// `fontFamily` render option (or per-chart `options.font.family`):
//
//     import { registerFonts, renderChart } from 'chartjs2img'
//     import { createRequire } from 'node:module'
//     const require = createRequire(import.meta.url)
//     await registerFonts({
//       'Noto Sans JP': [
//         require.resolve('@fontsource/noto-sans-jp/files/noto-sans-jp-japanese-400-normal.woff2'),
//         require.resolve('@fontsource/noto-sans-jp/files/noto-sans-jp-japanese-700-normal.woff2'),
//       ],
//     })
//     await renderChart({ chart, fontFamily: 'Noto Sans JP' })
//
// These load skia-canvas's FontLibrary lazily (via dynamic import) so that
// browser-engine-only or metadata-only consumers never pull in the native
// skia-canvas module. Loading it through this package guarantees the fonts
// register onto the *same* skia-canvas instance the skia engine renders with
// (importing `skia-canvas` yourself can resolve a different copy).
//
// Fonts are process-global once registered. Accepts .woff2/.woff/.ttf/.otf/.ttc.
// This only affects the `skia` engine; the `browser` engine uses Chromium's
// own font stack.

/** The skia-canvas FontLibrary type (for advanced use via {@link getFontLibrary}). */
export type { FontLibrary } from 'skia-canvas'

/**
 * Register one or more font families for the skia engine, e.g.
 * `{ 'Noto Sans JP': ['/path/regular.woff2', '/path/bold.woff2'] }`.
 * Returns the registered `Font` descriptors keyed by family.
 */
export async function registerFonts(
  families: Record<string, string | readonly string[]>,
): Promise<Record<string, unknown[]>> {
  const { FontLibrary } = await import('skia-canvas')
  return FontLibrary.use(families) as unknown as Record<string, unknown[]>
}

/**
 * The skia-canvas `FontLibrary` singleton the skia engine renders with — for
 * `has()`, `families`, `reset()`, or the other `use()` overloads. Loaded
 * lazily so non-skia consumers don't pull in the native module.
 */
export async function getFontLibrary(): Promise<import('skia-canvas').FontLibrary> {
  const { FontLibrary } = await import('skia-canvas')
  return FontLibrary
}

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
