// Chromium discovery contract. The pure-function parts — CHROMIUM_PATH
// env-var override and the negative path (no env, no system Chrome) —
// can be tested without a real browser by controlling env vars and
// asserting on `existsSync`-driven behavior.
import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { findChromiumExecutable } from '../../src/chromium'
import { existsSync, writeFileSync, unlinkSync, mkdtempSync, rmSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

// Preserve the caller's environment between tests — discovery reads
// several env vars and we do not want cross-test leakage.
const SAVED_ENV = {
  CHROMIUM_PATH: process.env.CHROMIUM_PATH,
  PLAYWRIGHT_BROWSERS_PATH: process.env.PLAYWRIGHT_BROWSERS_PATH,
}

describe('findChromiumExecutable', () => {
  let tmp: string

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'chromium-test-'))
    delete process.env.CHROMIUM_PATH
    // Point Playwright cache scan at an empty dir so platform-local
    // caches do not leak in and defeat the negative-path test.
    process.env.PLAYWRIGHT_BROWSERS_PATH = tmp
  })

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true })
    process.env.CHROMIUM_PATH = SAVED_ENV.CHROMIUM_PATH
    process.env.PLAYWRIGHT_BROWSERS_PATH = SAVED_ENV.PLAYWRIGHT_BROWSERS_PATH
  })

  test('CHROMIUM_PATH env var short-circuits discovery when the file exists', () => {
    const fake = join(tmp, 'fake-chrome')
    writeFileSync(fake, '#!/bin/sh\nexit 0\n')
    process.env.CHROMIUM_PATH = fake
    expect(findChromiumExecutable()).toBe(fake)
  })

  test('CHROMIUM_PATH pointing at a nonexistent file is ignored', () => {
    process.env.CHROMIUM_PATH = join(tmp, 'nonexistent')
    // Discovery must NOT return the bogus path. The return value is
    // either null or a real Chrome found elsewhere on this machine —
    // either way, it is not the fake path.
    const result = findChromiumExecutable()
    expect(result).not.toBe(process.env.CHROMIUM_PATH)
    if (result !== null) {
      expect(existsSync(result)).toBe(true)
    }
  })

  test('result is always either null or an existing file', () => {
    const result = findChromiumExecutable()
    if (result !== null) {
      expect(typeof result).toBe('string')
      expect(existsSync(result)).toBe(true)
    }
  })

  test('Playwright cache scan finds a binary in a well-formed cache dir', () => {
    const platform = process.platform
    let rel: string
    if (platform === 'darwin') {
      rel = 'chromium-9999/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
    } else if (platform === 'win32') {
      rel = 'chromium-9999\\chrome-win64\\chrome.exe'
    } else {
      rel = 'chromium-9999/chrome-linux/chrome'
    }
    const { mkdirSync } = require('fs') as typeof import('fs')
    const { dirname } = require('path') as typeof import('path')
    const full = join(tmp, rel)
    mkdirSync(dirname(full), { recursive: true })
    writeFileSync(full, '#!/bin/sh\nexit 0\n')
    expect(findChromiumExecutable()).toBe(full)
  })

  test('newer chromium-* directories are preferred (descending sort)', () => {
    const { mkdirSync } = require('fs') as typeof import('fs')
    const { dirname } = require('path') as typeof import('path')

    // Pick the layout for this platform.
    let rel: (v: string) => string
    if (process.platform === 'darwin') {
      rel = (v) => `chromium-${v}/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`
    } else if (process.platform === 'win32') {
      rel = (v) => `chromium-${v}\\chrome-win64\\chrome.exe`
    } else {
      rel = (v) => `chromium-${v}/chrome-linux/chrome`
    }

    const older = join(tmp, rel('1000'))
    const newer = join(tmp, rel('9999'))
    for (const p of [older, newer]) {
      mkdirSync(dirname(p), { recursive: true })
      writeFileSync(p, '#!/bin/sh\nexit 0\n')
    }
    expect(findChromiumExecutable()).toBe(newer)
  })
})
