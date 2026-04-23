import puppeteer, { type Browser, type Page } from 'puppeteer-core'
import { buildHtml, type RenderOptions } from './template'
import { Semaphore } from './semaphore'
import { computeHash, getCache, setCache } from './cache'
import { ensureChromiumInstalled } from './chromium'

/** Max concurrency (env: CONCURRENCY, default: 8) */
const MAX_CONCURRENCY = Number(process.env.CONCURRENCY ?? '8')

/** Page timeout in ms - force close orphaned pages after this (env: PAGE_TIMEOUT_SECONDS, default: 60) */
const PAGE_TIMEOUT_MS = Number(process.env.PAGE_TIMEOUT_SECONDS ?? '60') * 1000

const semaphore = new Semaphore(MAX_CONCURRENCY)

let browser: Browser | null = null
let launching = false
let launchPromise: Promise<Browser> | null = null

// Track active pages for lifecycle management
const activePages = new Map<Page, NodeJS.Timeout>()

// ---------------------------------------------------------------------------
// Browser lifecycle
// ---------------------------------------------------------------------------

async function launchBrowser(): Promise<Browser> {
  const execPath = await ensureChromiumInstalled()

  const b = await puppeteer.launch({
    executablePath: execPath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  })

  b.on('disconnected', () => {
    console.error('[renderer] Browser disconnected unexpectedly')
    browser = null
    launching = false
    launchPromise = null
  })

  return b
}

async function ensureBrowser(): Promise<Browser> {
  if (browser && browser.connected) {
    return browser
  }

  if (launching && launchPromise) {
    return launchPromise
  }

  launching = true
  launchPromise = launchBrowser()
    .then((b) => {
      launching = false
      browser = b
      console.log(`[renderer] Browser launched (concurrency: ${MAX_CONCURRENCY})`)
      return b
    })
    .catch((err) => {
      launching = false
      launchPromise = null
      browser = null
      throw err
    })

  return launchPromise
}

// ---------------------------------------------------------------------------
// Page lifecycle helpers
// ---------------------------------------------------------------------------

function schedulePageCleanup(page: Page): void {
  const timer = setTimeout(async () => {
    activePages.delete(page)
    try {
      if (!page.isClosed()) {
        console.warn('[renderer] Force-closing orphaned page after timeout')
        await page.close()
      }
    } catch {
      // page already closed
    }
  }, PAGE_TIMEOUT_MS)
  activePages.set(page, timer)
}

function clearPageCleanup(page: Page): void {
  const timer = activePages.get(page)
  if (timer) {
    clearTimeout(timer)
    activePages.delete(page)
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const CONTENT_TYPES: Record<string, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
}

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

export async function renderChart(options: RenderOptions): Promise<RenderResult> {
  const hash = computeHash(options)
  const format = options.format ?? 'png'
  const contentType = CONTENT_TYPES[format] ?? 'image/png'

  // Check cache first
  const cached = getCache(hash)
  if (cached) {
    return { buffer: cached.buffer, hash, contentType: cached.contentType, cached: true, messages: [] }
  }

  // Acquire semaphore slot (waits if at max concurrency)
  await semaphore.acquire()

  try {
    // Re-check cache (another request may have rendered while we waited)
    const cachedAgain = getCache(hash)
    if (cachedAgain) {
      return { buffer: cachedAgain.buffer, hash, contentType: cachedAgain.contentType, cached: true, messages: [] }
    }

    const b = await ensureBrowser()
    const page = await b.newPage()
    schedulePageCleanup(page)

    // Capture browser console messages (filter out Chromium internal noise)
    const messages: ConsoleMessage[] = []
    const IGNORED_PATTERNS = ['A parser-blocking, cross site', 'Third-party cookie will be blocked']
    page.on('console', (msg) => {
      const type = msg.type() as string
      if (type === 'error' || type === 'warning' || type === 'warn') {
        const text = msg.text()
        if (IGNORED_PATTERNS.some((p) => text.includes(p))) return
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
      // Use data URL with page.goto instead of setContent — puppeteer's setContent
      // does not reliably handle external script loading via networkidle.
      const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(html)
      await page.goto(dataUrl, { waitUntil: 'networkidle0', timeout: 30000 })
      await page.waitForFunction('window.__chartRendered === true', { timeout: 30000 })
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
      clearPageCleanup(page)
      try {
        if (!page.isClosed()) await page.close()
      } catch {
        // ignore
      }
    }
  } finally {
    semaphore.release()
  }
}

export async function closeBrowser(): Promise<void> {
  for (const [page, timer] of activePages) {
    clearTimeout(timer)
    try {
      if (!page.isClosed()) await page.close()
    } catch {
      // ignore
    }
  }
  activePages.clear()

  if (browser) {
    await browser.close()
    browser = null
  }
}

export function rendererStats() {
  return {
    browserConnected: browser?.connected ?? false,
    concurrency: { max: MAX_CONCURRENCY, active: semaphore.active, pending: semaphore.pending },
    activePages: activePages.size,
    pageTimeoutSeconds: PAGE_TIMEOUT_MS / 1000,
  }
}
