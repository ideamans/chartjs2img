// Minimal DOM globals for the skia rendering engine.
//
// A handful of Chart.js community plugins reach for browser globals that
// don't exist in Node/Bun:
//   - chartjs-chart-graph (force / tree)  -> requestAnimationFrame
//   - chartjs-chart-wordcloud             -> document.createElement('canvas')
//   - chartjs-chart-venn                  -> window.Path2D
// We install just enough to satisfy them. Everything is guarded so a real
// browser/Electron host (or a prior polyfill) is never clobbered.
//
// IMPORTANT: this module must be imported BEFORE chart.js and the plugins so
// that it has run by the time their module bodies evaluate. `chart-registry`
// lists it as its first import for exactly that reason. Defining `window` and
// `document` would normally make Chart.js pick DomPlatform; the skia engine
// forces `platform: BasicPlatform` on every chart to stay on the headless
// code path regardless.
import { Canvas, Path2D } from 'skia-canvas'

const g = globalThis as unknown as Record<string, unknown>

if (typeof g.requestAnimationFrame === 'undefined') {
  g.requestAnimationFrame = (cb: (t: number) => void) => setTimeout(() => cb(performance.now()), 16)
  g.cancelAnimationFrame = (id: unknown) => clearTimeout(id as ReturnType<typeof setTimeout>)
}

if (typeof g.Path2D === 'undefined') {
  g.Path2D = Path2D
}

if (typeof g.window === 'undefined') {
  // venn probes `window.Path2D`; a real skia Path2D (which parses SVG path
  // strings) lets it render its arc-slice fills faithfully.
  g.window = { Path2D }
}

if (typeof g.document === 'undefined') {
  g.document = {
    createElement: (tag: string) => (tag === 'canvas' ? new Canvas(1, 1) : {}),
    fonts: { addEventListener() {}, ready: Promise.resolve() },
  }
}
