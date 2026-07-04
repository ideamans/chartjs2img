// Engine selection + skia rendering. The browser engine is exercised by the
// existing integration paths; here we cover the skia default and the cache
// separation between engines (both cheap and browser-free).
import { describe, test, expect } from 'bun:test'
import { computeHash } from '../../src/cache'
import { DEFAULT_ENGINE } from '../../src/template'
import { renderChart } from '../../src/renderer'

const CHART = {
  type: 'bar',
  data: { labels: ['A', 'B', 'C'], datasets: [{ data: [10, 20, 15], backgroundColor: ['#ff6384', '#36a2eb', '#ffce56'] }] },
}

describe('engine selection', () => {
  test('default engine is skia', () => {
    expect(DEFAULT_ENGINE).toBe('skia')
  })

  test('skia and browser cache under different hashes', () => {
    const skia = computeHash({ chart: CHART, engine: 'skia' })
    const browser = computeHash({ chart: CHART, engine: 'browser' })
    expect(skia).not.toBe(browser)
    // Omitting engine hashes the same as the explicit default.
    expect(computeHash({ chart: CHART })).toBe(skia)
  })
})

describe('skia engine render', () => {
  test('renders a valid PNG without launching a browser', async () => {
    const res = await renderChart({ chart: CHART, width: 400, height: 300, engine: 'skia' })
    expect(res.contentType).toBe('image/png')
    // PNG magic bytes.
    expect(res.buffer.subarray(0, 4).toString('hex')).toBe('89504e47')
    expect(res.buffer.length).toBeGreaterThan(1000)
    expect(res.messages.filter((m) => m.level === 'error')).toHaveLength(0)
  })

  test('renders JPEG when requested', async () => {
    const res = await renderChart({ chart: CHART, width: 400, height: 300, engine: 'skia', format: 'jpeg', quality: 80 })
    expect(res.contentType).toBe('image/jpeg')
    // JPEG SOI marker.
    expect(res.buffer.subarray(0, 2).toString('hex')).toBe('ffd8')
  })

  test('surfaces Chart.js errors as messages instead of throwing', async () => {
    const res = await renderChart({
      chart: { type: 'not-a-real-type', data: { labels: ['A'], datasets: [{ data: [1] }] } },
      engine: 'skia',
    })
    expect(res.buffer.length).toBeGreaterThan(0)
    expect(res.messages.some((m) => m.level === 'error')).toBe(true)
  })
})
