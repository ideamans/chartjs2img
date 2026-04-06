import { chromium, type Browser, type BrowserContext, type Page } from 'playwright'
import { existsSync } from 'fs'
import { buildHtml, type RenderOptions } from './template'
import { Semaphore } from './semaphore'
import { computeHash, getCache, setCache } from './cache'

/** Max concurrency (env: CONCURRENCY, default: 8) */
const MAX_CONCURRENCY = Number(process.env.CONCURRENCY ?? '8')

/** Page timeout in ms - force close orphaned pages after this (env: PAGE_TIMEOUT_SECONDS, default: 60) */
const PAGE_TIMEOUT_MS = Number(process.env.PAGE_TIMEOUT_SECONDS ?? '60') * 1000

const semaphore = new Semaphore(MAX_CONCURRENCY)

let browser: Browser | null = null
let context: BrowserContext | null = null
let launching = false
let launchPromise: Promise<BrowserContext> | null = null
let browserInstalled = false

// Track active pages for lifecycle management
const activePages = new Map<Page, NodeJS.Timeout>()

async function ensureChromiumInstalled(): Promise<void> {
  if (browserInstalled) return

  // Check if Chromium executable exists
  try {
    const execPath = chromium.executablePath()
    if (existsSync(execPath)) {
      browserInstalled = true
      return
    }
  } catch {
    // executablePath() may throw if browser registry is missing
  }

  console.log('[renderer] Chromium not found. Installing automatically...')

  const proc = Bun.spawn(['bunx', 'playwright', 'install', 'chromium'], {
    stdout: 'inherit',
    stderr: 'inherit',
  })
  const exitCode = await proc.exited

  if (exitCode !== 0) {
    // Fallback: try npx in case we're in a Node.js / Docker environment
    console.log('[renderer] Retrying with npx...')
    const proc2 = Bun.spawn(['npx', 'playwright', 'install', 'chromium'], {
      stdout: 'inherit',
      stderr: 'inherit',
    })
    const exitCode2 = await proc2.exited
    if (exitCode2 !== 0) {
      throw new Error('Failed to install Chromium. Please run: bunx playwright install chromium')
    }
  }

  console.log('[renderer] Chromium installed successfully')
  browserInstalled = true
}

async function launchBrowser(): Promise<BrowserContext> {
  await ensureChromiumInstalled()

  browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  })

  // Auto-restart on unexpected disconnect
  browser.on('disconnected', () => {
    console.error('[renderer] Browser disconnected unexpectedly')
    browser = null
    context = null
    launching = false
    launchPromise = null
  })

  context = await browser.newContext()
  return context
}

async function ensureBrowser(): Promise<BrowserContext> {
  // Already running and connected
  if (browser && browser.isConnected() && context) {
    return context
  }

  // Another caller is already launching - wait for it
  if (launching && launchPromise) {
    return launchPromise
  }

  // Need to (re)launch
  launching = true
  launchPromise = launchBrowser()
    .then((ctx) => {
      launching = false
      console.log(`[renderer] Browser launched (concurrency: ${MAX_CONCURRENCY})`)
      return ctx
    })
    .catch((err) => {
      launching = false
      launchPromise = null
      browser = null
      context = null
      throw err
    })

  return launchPromise
}

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

const CONTENT_TYPES: Record<string, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
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

    // Ensure browser is up
    const ctx = await ensureBrowser()

    // Create a new page (tab) for this render
    const page = await ctx.newPage()
    schedulePageCleanup(page)

    // Capture browser console messages (filter out Chromium internal noise)
    const messages: ConsoleMessage[] = []
    const IGNORED_PATTERNS = [
      'A parser-blocking, cross site',
      'Third-party cookie will be blocked',
    ]
    page.on('console', (msg) => {
      const type = msg.type()
      if (type === 'error' || type === 'warning' || type === 'warn') {
        const text = msg.text()
        if (IGNORED_PATTERNS.some((p) => text.includes(p))) return
        messages.push({ level: type === 'warning' || type === 'warn' ? 'warn' : 'error', message: text })
      }
    })
    page.on('pageerror', (err) => {
      messages.push({ level: 'error', message: err.message })
    })

    try {
      const html = buildHtml(options)
      const width = options.width ?? 800
      const height = options.height ?? 600

      await page.setViewportSize({ width, height })
      await page.setContent(html, { waitUntil: 'networkidle' })
      await page.waitForFunction('window.__chartRendered === true', null, { timeout: 10000 })
      await page.waitForTimeout(100)

      // Collect messages captured inside the page (Chart.js warnings/errors)
      const pageMessages = await page.evaluate(() => (window as any).__chartMessages ?? [])
      for (const m of pageMessages) {
        // Avoid duplicates from console listener
        if (!messages.some((existing) => existing.message === m.message && existing.level === m.level)) {
          messages.push({ level: m.level, message: m.message })
        }
      }

      // Check if Chart.js threw an error during construction
      const chartError = await page.evaluate(() => (window as any).__chartError)
      if (chartError) {
        // Still return the result (may have partial render), but ensure error is in messages
        if (!messages.some((m) => m.message === chartError)) {
          messages.push({ level: 'error', message: chartError })
        }
      }

      const container = page.locator('#chart-container')

      const screenshotOptions: Record<string, unknown> = {
        type: format === 'webp' ? 'png' : format,
        omitBackground: options.backgroundColor === 'transparent',
      }
      if (format === 'jpeg') {
        screenshotOptions.quality = options.quality ?? 90
      }

      const rawBuffer = await container.screenshot(screenshotOptions)
      const buffer = Buffer.from(rawBuffer)

      // Store in cache
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
  // Clean up all tracked pages
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
    context = null
  }
}

export function rendererStats() {
  return {
    browserConnected: browser?.isConnected() ?? false,
    concurrency: { max: MAX_CONCURRENCY, active: semaphore.active, pending: semaphore.pending },
    activePages: activePages.size,
    pageTimeoutSeconds: PAGE_TIMEOUT_MS / 1000,
  }
}
