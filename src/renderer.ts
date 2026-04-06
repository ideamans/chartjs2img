import { existsSync, readdirSync, mkdirSync, writeFileSync, chmodSync } from 'fs'
import { join } from 'path'
import { homedir, platform, arch } from 'os'
import { buildHtml, type RenderOptions } from './template'
import { Semaphore } from './semaphore'
import { computeHash, getCache, setCache } from './cache'

// Playwright types are imported lazily to avoid module resolution errors in compiled binaries
type Browser = import('playwright').Browser
type BrowserContext = import('playwright').BrowserContext
type Page = import('playwright').Page

/** Max concurrency (env: CONCURRENCY, default: 8) */
const MAX_CONCURRENCY = Number(process.env.CONCURRENCY ?? '8')

/** Page timeout in ms - force close orphaned pages after this (env: PAGE_TIMEOUT_SECONDS, default: 60) */
const PAGE_TIMEOUT_MS = Number(process.env.PAGE_TIMEOUT_SECONDS ?? '60') * 1000

const semaphore = new Semaphore(MAX_CONCURRENCY)

let browser: Browser | null = null
let context: BrowserContext | null = null
let launching = false
let launchPromise: Promise<BrowserContext> | null = null
let chromiumPath: string | null = null

// Track active pages for lifecycle management
const activePages = new Map<Page, NodeJS.Timeout>()

/**
 * Find the Chromium executable in the Playwright browser cache.
 * Works in both development (via playwright's registry) and compiled binary mode.
 */
function findChromiumExecutable(): string | null {
  // 1. Environment variable override
  if (process.env.CHROMIUM_PATH && existsSync(process.env.CHROMIUM_PATH)) {
    return process.env.CHROMIUM_PATH
  }

  // 2. Try playwright's chromium.executablePath() (works in dev, may fail in compiled binary)
  try {
    const { chromium } = require('playwright')
    const execPath = chromium.executablePath()
    if (existsSync(execPath)) return execPath
  } catch {
    // Expected to fail in compiled binary mode
  }

  // 3. Scan Playwright's browser cache directories
  const home = homedir()
  const os = platform()

  const cacheDirs: string[] = []
  if (os === 'darwin') {
    cacheDirs.push(join(home, 'Library', 'Caches', 'ms-playwright'))
  } else if (os === 'linux') {
    cacheDirs.push(join(home, '.cache', 'ms-playwright'))
  } else if (os === 'win32') {
    cacheDirs.push(join(home, 'AppData', 'Local', 'ms-playwright'))
  }
  // Also check PLAYWRIGHT_BROWSERS_PATH
  if (process.env.PLAYWRIGHT_BROWSERS_PATH) {
    cacheDirs.unshift(process.env.PLAYWRIGHT_BROWSERS_PATH)
  }

  // Executable paths relative to chromium-<revision> directory
  const execPaths: Record<string, string[]> = {
    darwin: [
      'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
      'chrome-mac/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
      'chrome-mac-arm64/Chromium.app/Contents/MacOS/Chromium',
      'chrome-mac/Chromium.app/Contents/MacOS/Chromium',
    ],
    linux: [
      'chrome-linux/chrome',
      'chrome-linux64/chrome',
      'chrome-linux/chromium',
    ],
    win32: [
      'chrome-win64/chrome.exe',
      'chrome-win/chrome.exe',
    ],
  }

  const candidates = execPaths[os] ?? execPaths['linux']

  for (const cacheDir of cacheDirs) {
    if (!existsSync(cacheDir)) continue

    // Find chromium-* directories, sorted descending to prefer newest revision
    let entries: string[]
    try {
      entries = readdirSync(cacheDir)
        .filter((e) => e.startsWith('chromium-'))
        .sort()
        .reverse()
    } catch {
      continue
    }

    for (const entry of entries) {
      for (const relPath of candidates) {
        const fullPath = join(cacheDir, entry, relPath)
        if (existsSync(fullPath)) return fullPath
      }
    }
  }

  // 4. Check for system-installed Chrome/Chromium
  const systemPaths: Record<string, string[]> = {
    darwin: [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      join(home, 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
    ],
    linux: [
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/snap/bin/chromium',
    ],
    win32: [
      join(process.env.PROGRAMFILES ?? 'C:\\Program Files', 'Google\\Chrome\\Application\\chrome.exe'),
      join(process.env['PROGRAMFILES(X86)'] ?? 'C:\\Program Files (x86)', 'Google\\Chrome\\Application\\chrome.exe'),
      join(home, 'AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'),
    ],
  }

  for (const p of systemPaths[os] ?? []) {
    if (existsSync(p)) return p
  }

  return null
}

/** Resolve the Chrome for Testing platform string for the current OS/arch */
function getCftPlatform(): string {
  const os = platform()
  const a = arch()
  if (os === 'darwin') return a === 'arm64' ? 'mac-arm64' : 'mac-x64'
  if (os === 'win32') return a === 'x64' ? 'win64' : 'win32'
  return a === 'arm64' ? 'linux-arm64' : 'linux64'
}

/** Download Chrome for Testing and extract to a local directory. No external tools required. */
async function downloadChromeForTesting(): Promise<string> {
  const os = platform()
  const cftPlatform = getCftPlatform()

  // Determine install directory
  const home = homedir()
  let installBase: string
  if (os === 'darwin') {
    installBase = join(home, 'Library', 'Caches', 'ms-playwright')
  } else if (os === 'win32') {
    installBase = join(home, 'AppData', 'Local', 'ms-playwright')
  } else {
    installBase = join(home, '.cache', 'ms-playwright')
  }
  const installDir = join(installBase, 'chromium-cft')
  mkdirSync(installDir, { recursive: true })

  // Fetch latest stable Chrome for Testing download URL
  console.log('[renderer] Fetching Chrome for Testing download info...')
  const apiUrl = 'https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions-with-downloads.json'
  const res = await fetch(apiUrl)
  if (!res.ok) throw new Error(`Failed to fetch Chrome for Testing API: ${res.status}`)
  const data = (await res.json()) as any
  const entry = data.channels.Stable.downloads.chrome.find((d: any) => d.platform === cftPlatform)
  if (!entry) throw new Error(`No Chrome for Testing download for platform: ${cftPlatform}`)
  const downloadUrl: string = entry.url
  const version: string = data.channels.Stable.version

  console.log(`[renderer] Downloading Chrome ${version} for ${cftPlatform}...`)
  const dlRes = await fetch(downloadUrl)
  if (!dlRes.ok) throw new Error(`Download failed: ${dlRes.status}`)
  const zipBuffer = Buffer.from(await dlRes.arrayBuffer())

  // Write zip to temp file and extract
  const zipPath = join(installDir, 'chrome.zip')
  writeFileSync(zipPath, zipBuffer)

  console.log('[renderer] Extracting...')
  if (os === 'win32') {
    // PowerShell Expand-Archive
    const proc = Bun.spawn(['powershell', '-Command', `Expand-Archive -Force -Path '${zipPath}' -DestinationPath '${installDir}'`], {
      stdout: 'inherit',
      stderr: 'inherit',
    })
    if ((await proc.exited) !== 0) throw new Error('Failed to extract Chrome zip (PowerShell)')
  } else {
    // unzip is pre-installed on macOS and most Linux
    const proc = Bun.spawn(['unzip', '-o', '-q', zipPath, '-d', installDir], {
      stdout: 'inherit',
      stderr: 'inherit',
    })
    if ((await proc.exited) !== 0) throw new Error('Failed to extract Chrome zip (unzip)')
  }

  // Clean up zip
  try {
    const { unlinkSync } = await import('fs')
    unlinkSync(zipPath)
  } catch {
    // ignore
  }

  // Find the extracted executable
  // Chrome for Testing extracts to: chrome-<platform>/chrome (or .exe on Windows)
  const execCandidates: Record<string, string[]> = {
    darwin: [
      `chrome-${cftPlatform}/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`,
    ],
    linux: [
      `chrome-${cftPlatform}/chrome`,
    ],
    win32: [
      `chrome-${cftPlatform}\\chrome.exe`,
    ],
  }

  for (const rel of execCandidates[os] ?? execCandidates['linux']) {
    const fullPath = join(installDir, rel)
    if (existsSync(fullPath)) {
      // Ensure executable permission on Unix
      if (os !== 'win32') {
        try { chmodSync(fullPath, 0o755) } catch { /* ignore */ }
      }
      return fullPath
    }
  }

  throw new Error('Chrome was downloaded but executable not found in extracted files')
}

async function installChromiumViaPlaywright(): Promise<void> {
  // Use playwright-core's built-in registry to download Chromium directly — no bunx/npx needed
  const { registry } = await import('playwright-core/lib/server')
  const chromiumEntry = registry._executables.find((e: any) => e.name === 'chromium')
  if (!chromiumEntry) {
    throw new Error('Chromium entry not found in playwright registry')
  }
  await registry.install([chromiumEntry])
}

async function ensureChromiumInstalled(): Promise<string> {
  if (chromiumPath) return chromiumPath

  // Try to find existing installation
  const found = findChromiumExecutable()
  if (found) {
    chromiumPath = found
    return chromiumPath
  }

  console.log('[renderer] Chromium not found. Installing automatically...')

  // Strategy 1: Use playwright's built-in registry installer (works in dev / node_modules available)
  try {
    await installChromiumViaPlaywright()
    const p = findChromiumExecutable()
    if (p) {
      console.log('[renderer] Chromium installed successfully via Playwright')
      chromiumPath = p
      return chromiumPath
    }
  } catch {
    // Expected to fail in compiled binary — fall through to Chrome for Testing
  }

  // Strategy 2: Download Chrome for Testing directly (standalone binary friendly)
  try {
    const p = await downloadChromeForTesting()
    console.log('[renderer] Chrome for Testing installed successfully')
    chromiumPath = p
    return chromiumPath
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(
      `Failed to install Chromium automatically: ${msg}\n` +
        'You can install it manually:\n' +
        '  npx playwright install chromium\n' +
        'Or set CHROMIUM_PATH to an existing Chrome/Chromium executable.',
    )
  }
}

async function launchBrowser(): Promise<BrowserContext> {
  const execPath = await ensureChromiumInstalled()
  const { chromium } = await import('playwright')

  browser = await chromium.launch({
    executablePath: execPath,
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
