// Chart rendering via a managed Chromium.
//
// The Renderer class owns a single puppeteer Browser plus a semaphore
// and page-safety-net timers. Multiple Renderer instances are safe
// (they don't share state). For backwards compatibility with earlier
// module-level callers, a lazily-constructed default singleton backs
// the module-level renderChart / closeBrowser / rendererStats
// functions.
//
// Keeping state inside a class (rather than module vars) means tests
// can spin up an isolated Renderer and tear it down without affecting
// whatever other code the same process is running.
import puppeteer, { type Browser, type Page } from 'puppeteer-core'
import { buildHtml, type RenderOptions } from './template'
import { Semaphore } from './semaphore'
import { computeHash, getCache, setCache } from './cache'
import { ensureChromiumInstalled } from './chromium'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface ConsoleMessage {
  level: 'error' | 'warn' | 'info' | 'log'
  message: string
}

export interface RenderResult {
  buffer: Buffer
  hash: string
  contentType: string
  cached: boolean
  /** Console messages (errors/warnings) from Chart.js during rendering */
  messages: ConsoleMessage[]
}

export interface RendererConfig {
  /** Max simultaneous renders. Defaults to CONCURRENCY env or 8. */
  maxConcurrency?: number
  /**
   * Hard upper bound on a single render (applied to page.goto and
   * page.waitForFunction). Defaults to MAX_RENDER_TIME_SECONDS env or
   * 30s. Chart rendering itself is sub-second; 30s accommodates slow
   * CDN fetches of Chart.js + plugins on cold start.
   */
  maxRenderTimeMs?: number
  /**
   * Safety-net timeout for force-closing a page if the render flow
   * somehow never reaches its finally block. This is a LAST-RESORT
   * leak guard, not a render budget — the per-render timeout above is
   * what you want to tune for slow environments.
   *
   * Defaults to `maxRenderTimeMs * 2 + 10s`, which leaves room for
   * both goto and waitForFunction to fail with their own timeout and
   * still have the finally block clean up before this fires. Can be
   * overridden via PAGE_TIMEOUT_SECONDS env for legacy operators.
   */
  pageSafetyNetMs?: number
}

export interface RendererStats {
  browserConnected: boolean
  concurrency: { max: number; active: number; pending: number }
  activePages: number
  /** Rendering-budget timeout (goto + waitForFunction) in seconds. */
  maxRenderTimeSeconds: number
  /** Last-resort page force-close timer in seconds. Always > maxRenderTimeSeconds. */
  pageSafetyNetSeconds: number
  /**
   * @deprecated alias of pageSafetyNetSeconds for /health consumers
   * that shipped before the field was renamed. Will be removed.
   */
  pageTimeoutSeconds: number
}

const CONTENT_TYPES: Record<string, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
}

const DEFAULT_MAX_CONCURRENCY = Number(process.env.CONCURRENCY ?? '8')
const DEFAULT_MAX_RENDER_TIME_MS = Number(process.env.MAX_RENDER_TIME_SECONDS ?? '30') * 1000

function defaultSafetyNetMs(maxRenderTimeMs: number): number {
  // Legacy operators may still set PAGE_TIMEOUT_SECONDS; honor it
  // verbatim rather than silently override.
  if (process.env.PAGE_TIMEOUT_SECONDS) {
    return Number(process.env.PAGE_TIMEOUT_SECONDS) * 1000
  }
  // goto + waitForFunction + cleanup margin. If the finally block
  // runs, it clears this timer before it ever fires.
  return maxRenderTimeMs * 2 + 10_000
}

// Console noise from Chromium that should never surface to the caller.
const IGNORED_CONSOLE_PATTERNS = [
  'A parser-blocking, cross site',
  'Third-party cookie will be blocked',
]

// ---------------------------------------------------------------------------
// Renderer class
// ---------------------------------------------------------------------------

export class Renderer {
  private readonly maxConcurrency: number
  private readonly maxRenderTimeMs: number
  private readonly pageSafetyNetMs: number
  private readonly semaphore: Semaphore

  private browser: Browser | null = null
  private launching = false
  private launchPromise: Promise<Browser> | null = null

  // Pages that haven't reached their render finally block yet. Each
  // maps to a setTimeout() that force-closes the page if the finally
  // block never runs (genuinely orphaned tab).
  private readonly activePages = new Map<Page, NodeJS.Timeout>()

  constructor(config: RendererConfig = {}) {
    this.maxConcurrency = config.maxConcurrency ?? DEFAULT_MAX_CONCURRENCY
    this.maxRenderTimeMs = config.maxRenderTimeMs ?? DEFAULT_MAX_RENDER_TIME_MS
    this.pageSafetyNetMs = config.pageSafetyNetMs ?? defaultSafetyNetMs(this.maxRenderTimeMs)
    this.semaphore = new Semaphore(this.maxConcurrency)
  }

  // -- browser lifecycle ----------------------------------------------------

  private async launchBrowser(): Promise<Browser> {
    const execPath = await ensureChromiumInstalled()

    const b = await puppeteer.launch({
      executablePath: execPath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    })

    b.on('disconnected', () => {
      console.error('[renderer] Browser disconnected unexpectedly')
      this.browser = null
      this.launching = false
      this.launchPromise = null
    })

    return b
  }

  private async ensureBrowser(): Promise<Browser> {
    if (this.browser && this.browser.connected) {
      return this.browser
    }

    if (this.launching && this.launchPromise) {
      return this.launchPromise
    }

    this.launching = true
    this.launchPromise = this.launchBrowser()
      .then((b) => {
        this.launching = false
        this.browser = b
        console.log(`[renderer] Browser launched (concurrency: ${this.maxConcurrency})`)
        return b
      })
      .catch((err) => {
        this.launching = false
        this.launchPromise = null
        this.browser = null
        throw err
      })

    return this.launchPromise
  }

  // -- page lifecycle helpers ----------------------------------------------

  private schedulePageCleanup(page: Page): void {
    const timer = setTimeout(async () => {
      this.activePages.delete(page)
      try {
        if (!page.isClosed()) {
          console.warn(
            `[renderer] Safety net fired after ${this.pageSafetyNetMs}ms — force-closing orphaned page. ` +
              'This indicates the render finally block did not run; please file a bug.',
          )
          await page.close()
        }
      } catch {
        // page already closed
      }
    }, this.pageSafetyNetMs)
    this.activePages.set(page, timer)
  }

  private clearPageCleanup(page: Page): void {
    const timer = this.activePages.get(page)
    if (timer) {
      clearTimeout(timer)
      this.activePages.delete(page)
    }
  }

  // -- public API ----------------------------------------------------------

  async render(options: RenderOptions): Promise<RenderResult> {
    const hash = computeHash(options)
    const format = options.format ?? 'png'
    const contentType = CONTENT_TYPES[format] ?? 'image/png'

    // Check cache first (fast path, avoids semaphore wait entirely).
    const cached = getCache(hash)
    if (cached) {
      return { buffer: cached.buffer, hash, contentType: cached.contentType, cached: true, messages: [] }
    }

    // Acquire semaphore slot (waits if at max concurrency).
    await this.semaphore.acquire()

    try {
      // Re-check cache — another request may have rendered the same
      // input while we were blocked on the semaphore.
      const cachedAgain = getCache(hash)
      if (cachedAgain) {
        return {
          buffer: cachedAgain.buffer,
          hash,
          contentType: cachedAgain.contentType,
          cached: true,
          messages: [],
        }
      }

      const b = await this.ensureBrowser()
      const page = await b.newPage()
      this.schedulePageCleanup(page)

      // Capture browser console messages (filter out Chromium internal noise)
      const messages: ConsoleMessage[] = []
      page.on('console', (msg) => {
        const type = msg.type() as string
        if (type === 'error' || type === 'warning' || type === 'warn') {
          const text = msg.text()
          if (IGNORED_CONSOLE_PATTERNS.some((p) => text.includes(p))) return
          messages.push({ level: type === 'warning' || type === 'warn' ? 'warn' : 'error', message: text })
        }
      })
      page.on('pageerror', (err: unknown) => {
        messages.push({ level: 'error', message: err instanceof Error ? err.message : String(err) })
      })

      try {
        const html = buildHtml(options)
        const width = options.width ?? 800
        const height = options.height ?? 600

        await page.setViewport({ width, height })
        // Use data URL with page.goto instead of setContent — puppeteer's
        // setContent does not reliably honor networkidle for external
        // <script src> loading, so charts would sometimes screenshot
        // before Chart.js was even parsed.
        const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(html)
        await page.goto(dataUrl, { waitUntil: 'networkidle0', timeout: this.maxRenderTimeMs })
        await page.waitForFunction('window.__chartRendered === true', { timeout: this.maxRenderTimeMs })
        await new Promise((r) => setTimeout(r, 100))

        // Collect messages captured inside the page (Chart.js warnings/errors)
        const pageMessages = await page.evaluate(() => (window as any).__chartMessages ?? [])
        for (const m of pageMessages) {
          if (!messages.some((existing) => existing.message === m.message && existing.level === m.level)) {
            messages.push({ level: m.level, message: m.message })
          }
        }

        // Check if Chart.js threw an error during construction
        const chartError = await page.evaluate(() => (window as any).__chartError)
        if (chartError) {
          if (!messages.some((m) => m.message === chartError)) {
            messages.push({ level: 'error', message: chartError })
          }
        }

        const container = await page.$('#chart-container')
        if (!container) throw new Error('Chart container element not found')

        const screenshotOptions: Record<string, unknown> = {
          type: format,
          omitBackground: options.backgroundColor === 'transparent',
        }
        if (format === 'jpeg') {
          screenshotOptions.quality = options.quality ?? 90
        }

        const rawBuffer = await container.screenshot(screenshotOptions)
        const buffer = Buffer.from(rawBuffer)

        setCache(hash, buffer, contentType)

        return { buffer, hash, contentType, cached: false, messages }
      } finally {
        this.clearPageCleanup(page)
        try {
          if (!page.isClosed()) await page.close()
        } catch {
          // ignore
        }
      }
    } finally {
      this.semaphore.release()
    }
  }

  async close(): Promise<void> {
    for (const [page, timer] of this.activePages) {
      clearTimeout(timer)
      try {
        if (!page.isClosed()) await page.close()
      } catch {
        // ignore
      }
    }
    this.activePages.clear()

    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }

  stats(): RendererStats {
    const safetyNetSeconds = this.pageSafetyNetMs / 1000
    return {
      browserConnected: this.browser?.connected ?? false,
      concurrency: { max: this.maxConcurrency, active: this.semaphore.active, pending: this.semaphore.pending },
      activePages: this.activePages.size,
      maxRenderTimeSeconds: this.maxRenderTimeMs / 1000,
      pageSafetyNetSeconds: safetyNetSeconds,
      pageTimeoutSeconds: safetyNetSeconds, // deprecated alias
    }
  }
}

// ---------------------------------------------------------------------------
// Default-singleton module API (backwards compatibility)
// ---------------------------------------------------------------------------

let defaultRenderer: Renderer | null = null

function getDefault(): Renderer {
  if (!defaultRenderer) defaultRenderer = new Renderer()
  return defaultRenderer
}

export async function renderChart(options: RenderOptions): Promise<RenderResult> {
  return getDefault().render(options)
}

export async function closeBrowser(): Promise<void> {
  if (defaultRenderer) {
    await defaultRenderer.close()
    defaultRenderer = null
  }
}

export function rendererStats(): RendererStats {
  if (!defaultRenderer) {
    const safetyNetSeconds = defaultSafetyNetMs(DEFAULT_MAX_RENDER_TIME_MS) / 1000
    return {
      browserConnected: false,
      concurrency: { max: DEFAULT_MAX_CONCURRENCY, active: 0, pending: 0 },
      activePages: 0,
      maxRenderTimeSeconds: DEFAULT_MAX_RENDER_TIME_MS / 1000,
      pageSafetyNetSeconds: safetyNetSeconds,
      pageTimeoutSeconds: safetyNetSeconds, // deprecated alias
    }
  }
  return defaultRenderer.stats()
}
