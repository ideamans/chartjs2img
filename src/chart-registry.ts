// Chart.js + plugin registration for the skia engine.
import { installSkiaPolyfills } from './skia-polyfills'
import { Chart, registerables, BasicPlatform } from 'chart.js'
// chart.js ships DISTINCT esm (dist/chart.js) and cjs (dist/chart.cjs) builds
// whose element classes are NOT `===`. chartjs-plugin-datalabels has no
// `exports` map, so a bare specifier resolves its CJS build under Node ESM,
// binding the CJS chart.js — then `el instanceof BarElement` is always false
// and bar labels mis-position. Import its ESM build explicitly so it binds the
// SAME chart.js instance we register into.
import ChartDataLabels from 'chartjs-plugin-datalabels/dist/chartjs-plugin-datalabels.esm.js'
import annotationPlugin from 'chartjs-plugin-annotation'
import gradient from 'chartjs-plugin-gradient'
import 'chartjs-adapter-date-fns'
import * as matrix from 'chartjs-chart-matrix'
import * as sankey from 'chartjs-chart-sankey'
import * as treemap from 'chartjs-chart-treemap'
import * as wordcloud from 'chartjs-chart-wordcloud'
import * as geo from 'chartjs-chart-geo'
import * as graph from 'chartjs-chart-graph'
import * as venn from 'chartjs-chart-venn'

// NOTE: chartjs-plugin-zoom is intentionally NOT bundled into the skia engine.
// It depends on Hammer.js, which touches `document.documentElement.style` at
// import time and expects a live DOM for gesture handling. Zoom is an
// interaction plugin with no effect on a static render, so the browser engine
// keeps it and the skia engine skips it.

function registerNamespace(mod: Record<string, unknown>): void {
  for (const v of Object.values(mod)) {
    if (v && typeof (v as { id?: unknown }).id === 'string') {
      try {
        Chart.register(v as Parameters<typeof Chart.register>[0])
      } catch {
        // already registered
      }
    }
  }
}

let registered = false

/** Register Chart.js + all bundled plugins exactly once (idempotent). */
export function ensureRegistered(): void {
  // Install DOM globals before any plugin code can run. Safe to call every
  // time (idempotent); doing it here means the polyfills are guaranteed in
  // place before the first render regardless of import order or tree-shaking.
  installSkiaPolyfills()
  if (registered) return
  registered = true

  Chart.register(...registerables)
  for (const mod of [matrix, sankey, treemap, wordcloud, geo, graph, venn]) {
    registerNamespace(mod as Record<string, unknown>)
  }
  Chart.register(annotationPlugin)
  Chart.register(gradient)
  Chart.register(ChartDataLabels)
  // Match src/template.ts (the browser engine): datalabels hidden unless a
  // chart explicitly turns it on.
  Chart.defaults.set('plugins.datalabels', { display: false })
}

export { Chart, BasicPlatform }
