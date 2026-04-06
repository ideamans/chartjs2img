import { existsSync, readdirSync, mkdirSync, writeFileSync, chmodSync, unlinkSync } from 'fs'
import { join } from 'path'
import { homedir, platform, arch } from 'os'
import puppeteer, { type Browser, type Page } from 'puppeteer-core'
import { buildHtml, type RenderOptions } from './template'
import { Semaphore } from './semaphore'
import { computeHash, getCache, setCache } from './cache'

/** Max concurrency (env: CONCURRENCY, default: 8) */
const MAX_CONCURRENCY = Number(process.env.CONCURRENCY ?? '8')

/** Page timeout in ms - force close orphaned pages after this (env: PAGE_TIMEOUT_SECONDS, default: 60) */
const PAGE_TIMEOUT_MS = Number(process.env.PAGE_TIMEOUT_SECONDS ?? '60') * 1000

const semaphore = new Semaphore(MAX_CONCURRENCY)

let browser: Browser | null = null
let launching = false
let launchPromise: Promise<Browser> | null = null
let chromiumPath: string | null = null

// Track active pages for lifecycle management
const activePages = new Map<Page, NodeJS.Timeout>()

// ---------------------------------------------------------------------------
// Chromium discovery & auto-install
// ---------------------------------------------------------------------------

/**
 * Find a Chromium/Chrome executable.
 * Checks: CHROMIUM_PATH env → Playwright cache → system Chrome → Chrome for Testing cache
 */
function findChromiumExecutable(): string | null {
  const os = platform()
  const home = homedir()

  // 1. Environment variable override
  if (process.env.CHROMIUM_PATH && existsSync(process.env.CHROMIUM_PATH)) {
    return process.env.CHROMIUM_PATH
  }

  // 2. Scan Playwright's browser cache directories (from prior installs)
  const cacheDirs: string[] = []
  if (process.env.PLAYWRIGHT_BROWSERS_PATH) {
    cacheDirs.push(process.env.PLAYWRIGHT_BROWSERS_PATH)
  }
  if (os === 'darwin') {
    cacheDirs.push(join(home, 'Library', 'Caches', 'ms-playwright'))
  } else if (os === 'linux') {
    cacheDirs.push(join(home, '.cache', 'ms-playwright'))
  } else if (os === 'win32') {
    cacheDirs.push(join(home, 'AppData', 'Local', 'ms-playwright'))
  }

  const playwrightExecPaths: Record<string, string[]> = {
    darwin: [
      'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
      'chrome-mac/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
      'chrome-mac-arm64/Chromium.app/Contents/MacOS/Chromium',
      'chrome-mac/Chromium.app/Contents/MacOS/Chromium',
    ],
    linux: ['chrome-linux/chrome', 'chrome-linux64/chrome', 'chrome-linux/chromium'],
    win32: ['chrome-win64/chrome.exe', 'chrome-win/chrome.exe'],
  }

  const candidates = playwrightExecPaths[os] ?? playwrightExecPaths['linux']

  for (const cacheDir of cacheDirs) {
    if (!existsSync(cacheDir)) continue
    let entries: string[]
    try {
      entries = readdirSync(cacheDir)
        .filter((e) => e.startsWith('chromium'))
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

  // 3. System-installed Chrome/Chromium
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
  return 'linux64'
}

/** Download Chrome for Testing directly via fetch — no sudo, no npm/npx needed */
async function downloadChromeForTesting(): Promise<string> {
  const os = platform()
  const cftPlatform = getCftPlatform()

  // Install into user-local cache directory (no sudo)
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

  // Fetch latest stable download URL from Chrome for Testing API
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

  const zipPath = join(installDir, 'chrome.zip')
  writeFileSync(zipPath, zipBuffer)

  console.log('[renderer] Extracting...')
  if (os === 'win32') {
    const proc = Bun.spawn(
      ['powershell', '-Command', `Expand-Archive -Force -Path '${zipPath}' -DestinationPath '${installDir}'`],
      { stdout: 'inherit', stderr: 'inherit' },
    )
    if ((await proc.exited) !== 0) throw new Error('Failed to extract (PowerShell Expand-Archive)')
  } else {
    const proc = Bun.spawn(['unzip', '-o', '-q', zipPath, '-d', installDir], {
      stdout: 'inherit',
      stderr: 'inherit',
    })
    if ((await proc.exited) !== 0) throw new Error('Failed to extract (unzip)')
  }

  try {
    unlinkSync(zipPath)
  } catch {
    /* ignore */
  }

  // Find the extracted executable
  const execCandidates: Record<string, string[]> = {
    darwin: [`chrome-${cftPlatform}/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`],
    linux: [`chrome-${cftPlatform}/chrome`],
    win32: [`chrome-${cftPlatform}\\chrome.exe`],
  }

  for (const rel of execCandidates[os] ?? execCandidates['linux']) {
    const fullPath = join(installDir, rel)
    if (existsSync(fullPath)) {
      if (os !== 'win32') {
        try {
          chmodSync(fullPath, 0o755)
        } catch {
          /* ignore */
        }
      }
      return fullPath
    }
  }

  throw new Error('Chrome was downloaded but executable not found in extracted files')
}

async function ensureChromiumInstalled(): Promise<string> {
  if (chromiumPath) return chromiumPath

  const found = findChromiumExecutable()
  if (found) {
    chromiumPath = found
    return chromiumPath
  }

  console.log('[renderer] Chrome/Chromium not found. Installing Chrome for Testing...')

  try {
    const p = await downloadChromeForTesting()
    console.log('[renderer] Chrome for Testing installed successfully')
    chromiumPath = p
    return chromiumPath
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(
      `Failed to install Chrome automatically: ${msg}\n` +
        'You can install it manually:\n' +
        '  - Install Google Chrome, or\n' +
        '  - Set CHROMIUM_PATH env var to an existing Chrome/Chromium executable.',
    )
  }
}

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

    const b = await ensureBrowser()
    const page = await b.newPage()
    schedulePageCleanup(page)

    // Capture browser console messages (filter out Chromium internal noise)
    const messages: ConsoleMessage[] = []
    const IGNORED_PATTERNS = ['A parser-blocking, cross site', 'Third-party cookie will be blocked']
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
        type: format === 'webp' ? 'png' : format,
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
