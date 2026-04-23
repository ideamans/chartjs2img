// Chromium procurement.
//
// Three functions, each with a tight responsibility:
//   findChromiumExecutable — scan known install locations and return
//     a path if Chrome/Chromium is already present. Pure wrt. the
//     filesystem: it doesn't touch the network or create files.
//   downloadChromeForTesting — install Chrome for Testing into the
//     user-local Playwright cache. Side effects: fetch + fs write.
//   ensureChromiumInstalled — orchestrator. Returns a cached path if
//     called repeatedly within the same process.
//
// Split out from renderer.ts so renderer owns browser/page lifecycle,
// not platform-specific binary discovery.
import { existsSync, readdirSync, mkdirSync, writeFileSync, chmodSync, unlinkSync } from 'fs'
import { join } from 'path'
import { homedir, platform, arch } from 'os'

/**
 * Find a Chromium/Chrome executable already installed on this machine.
 * Checks: CHROMIUM_PATH env → Playwright cache → system Chrome → Chrome
 * for Testing cache.
 */
export function findChromiumExecutable(): string | null {
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

/** Chrome-for-Testing platform string for the current OS/arch, or null if unsupported */
function getCftPlatform(): string | null {
  const os = platform()
  const a = arch() as string
  if (os === 'darwin') return a === 'arm64' ? 'mac-arm64' : 'mac-x64'
  if (os === 'win32') return a === 'x64' ? 'win64' : 'win32'
  // Chrome for Testing only provides linux64 (x86_64) — no linux-arm64
  if (a === 'arm64' || a === 'aarch64') return null
  return 'linux64'
}

/** Download Chrome for Testing directly via fetch — no sudo, no npm/npx needed */
export async function downloadChromeForTesting(): Promise<string> {
  const os = platform()
  const cftPlatform = getCftPlatform()
  if (!cftPlatform) {
    throw new Error(
      `Chrome for Testing is not available for ${platform()}/${arch()}.\n` +
        'Install Chromium manually (e.g., apt install chromium) and set CHROMIUM_PATH.',
    )
  }

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
  console.log('[chromium] Fetching Chrome for Testing download info...')
  const apiUrl = 'https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions-with-downloads.json'
  const res = await fetch(apiUrl)
  if (!res.ok) throw new Error(`Failed to fetch Chrome for Testing API: ${res.status}`)
  const data = (await res.json()) as any
  const entry = data.channels.Stable.downloads.chrome.find((d: any) => d.platform === cftPlatform)
  if (!entry) throw new Error(`No Chrome for Testing download for platform: ${cftPlatform}`)
  const downloadUrl: string = entry.url
  const version: string = data.channels.Stable.version

  console.log(`[chromium] Downloading Chrome ${version} for ${cftPlatform}...`)
  const dlRes = await fetch(downloadUrl)
  if (!dlRes.ok) throw new Error(`Download failed: ${dlRes.status}`)
  const zipBuffer = Buffer.from(await dlRes.arrayBuffer())

  const zipPath = join(installDir, 'chrome.zip')
  writeFileSync(zipPath, zipBuffer)

  console.log('[chromium] Extracting...')
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

/**
 * Return a path to a Chromium executable, installing Chrome for Testing
 * on first call if no local Chrome/Chromium is discoverable. Caches the
 * result for the lifetime of the process.
 */
let cachedPath: string | null = null

export async function ensureChromiumInstalled(): Promise<string> {
  if (cachedPath) return cachedPath

  const found = findChromiumExecutable()
  if (found) {
    cachedPath = found
    return cachedPath
  }

  console.log('[chromium] Chrome/Chromium not found. Installing Chrome for Testing...')

  try {
    const p = await downloadChromeForTesting()
    console.log('[chromium] Chrome for Testing installed successfully')
    cachedPath = p
    return cachedPath
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
