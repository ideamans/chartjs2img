// Temporary integration test. Asserts that rendering the same chart
// through each of the three public interfaces — TypeScript library,
// CLI, and HTTP server — produces a PNG that differs from the golden
// baseline by less than 1% of pixels (with 1% color-distance fuzz to
// absorb anti-aliasing jitter).
//
// Lifecycle: this whole `tests/` tree is scaffolding for the
// refactoring pass and is removed when the refactor is signed off.
// See REVIEW.md for the rationale.
import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { $ } from 'bun'

import { renderChart, closeBrowser } from '../../src/lib'
import { startServer, type ServerHandle } from '../../src/server'
import { FIXTURES } from './fixtures'
import { imageDiffFraction } from './compare'

const ROOT = import.meta.dir
const BASELINE = join(ROOT, 'baseline')
const TMP = join(ROOT, 'tmp')
const FIXTURES_DIR = join(ROOT, 'fixtures')

const DIFF_THRESHOLD = 0.01 // <1% differing pixels

async function pickFreePort(): Promise<number> {
  const s = Bun.serve({ port: 0, fetch: () => new Response('x') })
  const p = s.port
  s.stop()
  return p
}

describe('3-interface equivalence vs. baseline', () => {
  let serverPort: number
  let handle: ServerHandle | null = null

  beforeAll(async () => {
    mkdirSync(TMP, { recursive: true })
    // Sanity: baseline must exist before tests run.
    for (const fx of FIXTURES) {
      if (!existsSync(join(BASELINE, `${fx.id}.png`))) {
        throw new Error(
          `Missing baseline for "${fx.id}". Run: bun run tests/integration/generate-baseline.ts`,
        )
      }
    }

    serverPort = await pickFreePort()
    handle = await startServer({ port: serverPort, host: '127.0.0.1' })
  })

  afterAll(async () => {
    if (handle) await handle.stop()
    await closeBrowser()
  })

  // --------------------------------------------------------------- TS lib
  describe('TypeScript library (src/lib.ts)', () => {
    for (const fx of FIXTURES) {
      test(fx.title, async () => {
        const res = await renderChart({
          chart: fx.config,
          width: fx.width,
          height: fx.height,
          format: 'png',
        })
        const out = join(TMP, `ts-${fx.id}.png`)
        writeFileSync(out, res.buffer)

        // Shape sanity.
        expect(res.buffer.length).toBeGreaterThan(1000)
        expect(res.contentType).toBe('image/png')
        // PNG signature.
        expect(res.buffer.slice(0, 8).toString('hex')).toBe('89504e470d0a1a0a')

        const diff = await imageDiffFraction(out, join(BASELINE, `${fx.id}.png`))
        expect(diff.fraction).toBeLessThan(DIFF_THRESHOLD)
      })
    }
  })

  // --------------------------------------------------------------- CLI
  describe('CLI (src/index.ts render)', () => {
    for (const fx of FIXTURES) {
      test(fx.title, async () => {
        const input = join(FIXTURES_DIR, `${fx.id}.json`)
        const out = join(TMP, `cli-${fx.id}.png`)
        const args = ['run', 'src/index.ts', 'render', '-i', input, '-o', out]
        if (fx.width) args.push('-w', String(fx.width))
        if (fx.height) args.push('-h', String(fx.height))
        const proc = Bun.spawn(['bun', ...args], {
          cwd: join(ROOT, '..', '..'),
          stdout: 'pipe',
          stderr: 'pipe',
        })
        const exit = await proc.exited
        expect(exit).toBe(0)

        const buf = readFileSync(out)
        expect(buf.length).toBeGreaterThan(1000)
        expect(buf.slice(0, 8).toString('hex')).toBe('89504e470d0a1a0a')

        const diff = await imageDiffFraction(out, join(BASELINE, `${fx.id}.png`))
        expect(diff.fraction).toBeLessThan(DIFF_THRESHOLD)
      })
    }
  })

  // --------------------------------------------------------------- HTTP
  describe('HTTP server (POST /render)', () => {
    for (const fx of FIXTURES) {
      test(fx.title, async () => {
        const body = {
          chart: fx.config,
          width: fx.width,
          height: fx.height,
          format: 'png',
        }
        const res = await fetch(`http://127.0.0.1:${serverPort}/render`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        expect(res.status).toBe(200)
        expect(res.headers.get('Content-Type')).toBe('image/png')

        const buf = Buffer.from(await res.arrayBuffer())
        expect(buf.length).toBeGreaterThan(1000)
        expect(buf.slice(0, 8).toString('hex')).toBe('89504e470d0a1a0a')

        const out = join(TMP, `http-${fx.id}.png`)
        writeFileSync(out, buf)

        const diff = await imageDiffFraction(out, join(BASELINE, `${fx.id}.png`))
        expect(diff.fraction).toBeLessThan(DIFF_THRESHOLD)
      })
    }
  })
})
