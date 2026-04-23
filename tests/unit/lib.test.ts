// Public library surface — the exports here are the contract external
// TS / Node consumers rely on. Lock them in so a rename or deletion
// surfaces loudly.
import { describe, test, expect } from 'bun:test'
import * as lib from '../../src/lib'

describe('src/lib.ts public surface', () => {
  test('exports the core render helpers', () => {
    expect(typeof lib.renderChart).toBe('function')
    expect(typeof lib.closeBrowser).toBe('function')
    expect(typeof lib.rendererStats).toBe('function')
  })

  test('exports the Renderer class for advanced users', () => {
    expect(typeof lib.Renderer).toBe('function')
    const r = new lib.Renderer({ maxConcurrency: 2, maxRenderTimeMs: 10_000 })
    const s = r.stats()
    expect(s.concurrency.max).toBe(2)
    expect(s.maxRenderTimeSeconds).toBe(10)
    expect(s.browserConnected).toBe(false)
  })

  test('exports computeHash for deduping / CDN use cases', () => {
    expect(typeof lib.computeHash).toBe('function')
    const h = lib.computeHash({ chart: { type: 'bar', data: { datasets: [{ data: [1] }] } } })
    expect(h).toMatch(/^[0-9a-f]{16}$/)
  })

  test('exports VERSION and NAME', () => {
    expect(typeof lib.VERSION).toBe('string')
    expect(lib.VERSION).toMatch(/^\d+\.\d+\.\d+/)
    expect(lib.NAME).toBe('chartjs2img')
  })

  test('exports BUNDLED_LIBS with Chart.js entry', () => {
    expect(lib.BUNDLED_LIBS.chartjs.pkg).toBe('chart.js')
  })
})

describe('Renderer defaults', () => {
  test('stats reflect env-derived defaults', () => {
    // Reads CONCURRENCY / MAX_RENDER_TIME_SECONDS at construction.
    const r = new lib.Renderer()
    const s = r.stats()
    expect(s.concurrency.max).toBeGreaterThan(0)
    expect(s.maxRenderTimeSeconds).toBeGreaterThan(0)
    expect(s.pageSafetyNetSeconds).toBeGreaterThan(s.maxRenderTimeSeconds)
    // Deprecated alias still populated for /health back-compat.
    expect(s.pageTimeoutSeconds).toBe(s.pageSafetyNetSeconds)
  })

  test('explicit config overrides env-derived defaults', () => {
    const r = new lib.Renderer({
      maxConcurrency: 1,
      maxRenderTimeMs: 5_000,
      pageSafetyNetMs: 20_000,
    })
    const s = r.stats()
    expect(s.concurrency.max).toBe(1)
    expect(s.maxRenderTimeSeconds).toBe(5)
    expect(s.pageSafetyNetSeconds).toBe(20)
  })
})
