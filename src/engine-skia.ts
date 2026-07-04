// skia-canvas rendering engine — the default engine.
//
// Renders a Chart.js config to a PNG/JPEG buffer using skia-canvas instead of
// headless Chromium. No browser process, no CDN fetch: Chart.js and the
// plugins are npm dependencies (see ./chart-registry), so a render is just
// CPU work and completes in tens of milliseconds.
//
// The browser and skia engines are kept behaviorally aligned. The quirks
// below are all things skia does differently from a browser's <canvas>, each
// resolved so the two engines produce matching output. See RESULT notes in
// the skia spike for the investigation behind each one.
import type { RenderOptions } from './template'
import type { ConsoleMessage } from './renderer'
import { Chart, BasicPlatform, ensureRegistered } from './chart-registry'
import { Canvas } from 'skia-canvas'

// Chart types from chartjs-chart-graph apply their layout over rAF ticks, so a
// naive capture can race a blank/half-laid-out frame. We poll until the node
// coordinates are finite and stable instead of guessing a fixed delay.
const GRAPH_TYPES = new Set(['forceDirectedGraph', 'tree', 'graph', 'dendrogram'])

// Matches a value that is two-or-more CSS colors joined (what an array of
// colors stringifies to). Used by the fill/strokeStyle shim below.
const MULTI_COLOR = /^\s*((?:rgba?|hsla?)\([^)]*\)|#[0-9a-fA-F]+)\s*,\s*(?:rgba?|hsla?|#)/

/**
 * skia diverges from browser <canvas> in three ways that affect Chart.js /
 * plugins. Patch the 2D context to match browser behavior:
 *
 *  1. fillText/strokeText's 4th `maxWidth` arg is a HARD CLIP in skia, not the
 *     CSS "condense to fit". chartjs-plugin-datalabels passes a maxWidth from
 *     its own measureText (sub-pixel narrower than skia's glyph advance), so
 *     trailing glyphs get chopped ("120" -> "12"). Drop the 4th arg.
 *  2. Assigning an invalid value to fillStyle/strokeStyle is IGNORED by skia
 *     (the style keeps its previous value), whereas browsers coerce e.g. an
 *     array via toString and latch onto its first color. chartjs-chart-treemap
 *     assigns a raw backgroundColor array straight to fillStyle, so cells
 *     stayed default black. Coerce array / multi-color values to their first
 *     color.
 */
function patchContext(ctx: CanvasRenderingContext2D): void {
  const anyCtx = ctx as unknown as {
    fillText: (t: string, x: number, y: number, w?: number) => void
    strokeText: (t: string, x: number, y: number, w?: number) => void
  }
  const fill = anyCtx.fillText.bind(ctx)
  const stroke = anyCtx.strokeText.bind(ctx)
  anyCtx.fillText = (t, x, y) => fill(t, x, y)
  anyCtx.strokeText = (t, x, y) => stroke(t, x, y)
  patchStyle(ctx, 'fillStyle')
  patchStyle(ctx, 'strokeStyle')
}

function patchStyle(ctx: CanvasRenderingContext2D, prop: 'fillStyle' | 'strokeStyle'): void {
  const proto = Object.getPrototypeOf(ctx)
  const desc = Object.getOwnPropertyDescriptor(proto, prop)
  if (!desc || !desc.set || !desc.get) return
  const { get, set } = desc
  Object.defineProperty(ctx, prop, {
    configurable: true,
    get() {
      return get.call(this)
    },
    set(v: unknown) {
      let value = v
      if (Array.isArray(value)) value = value[0]
      else if (typeof value === 'string') {
        const m = value.match(MULTI_COLOR)
        if (m) value = m[1]
      }
      set.call(this, value)
    },
  })
}

async function settleLayout(chart: Chart): Promise<void> {
  const nodes = () => chart.getDatasetMeta(0).data.map((e) => [e.x, e.y] as [number, number])
  const allFinite = (ns: [number, number][]) => ns.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y))
  const same = (a: [number, number][], b: [number, number][]) =>
    a.length === b.length && a.every(([x, y], i) => Math.abs(x - b[i][0]) < 0.01 && Math.abs(y - b[i][1]) < 0.01)
  let prev = nodes()
  for (let tick = 0; tick < 200; tick++) {
    await new Promise((r) => setTimeout(r, 16))
    const cur = nodes()
    if (allFinite(cur) && same(cur, prev)) break
    prev = cur
  }
  chart.draw()
}

export interface SkiaRenderResult {
  buffer: Buffer
  messages: ConsoleMessage[]
}

export async function renderSkia(options: RenderOptions): Promise<SkiaRenderResult> {
  ensureRegistered()

  const width = options.width ?? 800
  const height = options.height ?? 600
  const dpr = options.devicePixelRatio ?? 1
  const format = options.format ?? 'png'
  const background = options.backgroundColor ?? 'white'
  const messages: ConsoleMessage[] = []

  // Capture Chart.js warnings/errors the way the browser engine scrapes the
  // page console, so both engines surface the same diagnostics.
  const origWarn = console.warn
  const origError = console.error
  console.warn = (...a: unknown[]) => messages.push({ level: 'warn', message: a.join(' ') })
  console.error = (...a: unknown[]) => messages.push({ level: 'error', message: a.join(' ') })

  const canvas = new Canvas(width, height)
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
  patchContext(ctx)

  let chart: Chart | undefined
  try {
    // JSON round-trip mirrors the browser engine's JSON.stringify(chart) — it
    // deep-clones (so we never mutate the caller's config) and drops any
    // function values identically, keeping the two engines in lockstep.
    const config = JSON.parse(JSON.stringify(options.chart)) as Record<string, unknown>
    config.platform = BasicPlatform
    const opts = (config.options ?? {}) as Record<string, unknown>
    opts.devicePixelRatio = dpr
    opts.responsive = false
    opts.maintainAspectRatio = false
    opts.animation = false
    config.options = opts

    // Background fill. The browser engine renders onto a coloured <body>;
    // reproduce that with a beforeDraw pass, unless the caller asked for a
    // transparent canvas (PNG alpha).
    const inlinePlugins = Array.isArray(config.plugins) ? config.plugins : []
    if (background !== 'transparent') {
      inlinePlugins.push({
        id: 'chartjs2img_background',
        beforeDraw(c: Chart) {
          const cctx = c.ctx as unknown as CanvasRenderingContext2D
          cctx.save()
          cctx.globalCompositeOperation = 'destination-over'
          cctx.fillStyle = background
          cctx.fillRect(0, 0, c.width, c.height)
          cctx.restore()
        },
      })
    }
    config.plugins = inlinePlugins

    const type = (config.type ?? (config.data as { type?: string } | undefined)?.type) as string | undefined
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chart = new Chart(ctx as any, config as any)

    if (type && GRAPH_TYPES.has(type)) {
      await settleLayout(chart)
    }

    const buffer =
      format === 'jpeg'
        ? await canvas.toBuffer('jpeg', { quality: (options.quality ?? 90) / 100 })
        : await canvas.toBuffer('png')

    return { buffer, messages }
  } catch (e) {
    // Mirror the browser engine: a construction failure is reported as a
    // message, not thrown — the caller still gets a (blank) buffer.
    messages.push({ level: 'error', message: e instanceof Error ? e.message : String(e) })
    const buffer = format === 'jpeg' ? await canvas.toBuffer('jpeg', { quality: (options.quality ?? 90) / 100 }) : await canvas.toBuffer('png')
    return { buffer, messages }
  } finally {
    try {
      chart?.destroy()
    } catch {
      // ignore
    }
    console.warn = origWarn
    console.error = origError
  }
}
