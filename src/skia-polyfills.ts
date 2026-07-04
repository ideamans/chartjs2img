// Minimal DOM globals for the skia rendering engine.
//
// A handful of Chart.js community plugins reach for browser globals that
// don't exist in Node/Bun, all at RENDER time (not module-eval time):
//   - chartjs-chart-graph (force / tree)  -> requestAnimationFrame
//   - chartjs-chart-wordcloud             -> document.createElement('canvas')
//   - chartjs-chart-venn                  -> window.Path2D
//
// This is exposed as a CALLED function (not a bare side-effect import) on
// purpose: the package is published with "sideEffects" scoped tightly, and a
// side-effect-only module gets tree-shaken out of the `bun build --compile`
// binary. An imported-and-invoked function survives. `renderSkia` calls it
// before creating any chart, so the globals are always in place in time.
//
// Everything is guarded so a real browser/Electron host (or a prior polyfill)
// is never clobbered. Defining `window`/`document` would normally make
// Chart.js pick DomPlatform; the skia engine forces `platform: BasicPlatform`
// on every chart to stay on the headless code path regardless.
import { Canvas, Path2D } from 'skia-canvas'

let installed = false

/** Install the DOM globals the bundled plugins need (idempotent). */
export function installSkiaPolyfills(): void {
  if (installed) return
  installed = true

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
    //
    // EXCEPTION: inside a `bun build --compile` standalone binary,
    // chartjs-chart-venn's internal `new Path2D(...)` hits a skia-canvas
    // native-binding quirk (`this.native[fn]`) that does NOT occur under
    // `bun run`, the npm library, or the server. Detect the compiled binary
    // (its modules live under a `/$bunfs/` virtual FS) and leave window.Path2D
    // unset there, so venn falls back to its ctx.ellipse path — minor
    // overlap-fill artifacts, but it renders instead of throwing.
    const isCompiledBinary = import.meta.url.includes('/$bunfs/')
    g.window = isCompiledBinary ? {} : { Path2D }
  }

  if (typeof g.document === 'undefined') {
    g.document = {
      createElement: (tag: string) => (tag === 'canvas' ? new Canvas(1, 1) : {}),
      fonts: { addEventListener() {}, ready: Promise.resolve() },
    }
  }
}
