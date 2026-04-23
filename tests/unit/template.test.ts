// HTML template contract. buildHtml() is pure — it produces a string
// from a chart config. We assert on the invariants the rendering
// pipeline relies on (plugin <script> tags present, animation forced
// off, chart config is correctly JSON-escaped into the page's IIFE).
import { describe, test, expect } from 'bun:test'
import { buildHtml, LIBS, type RenderOptions } from '../../src/template'

const minimal: RenderOptions = {
  chart: { type: 'bar', data: { labels: ['A'], datasets: [{ data: [1] }] } },
}

describe('buildHtml', () => {
  test('returns a complete HTML document', () => {
    const html = buildHtml(minimal)
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true)
    expect(html).toContain('<html>')
    expect(html).toContain('</html>')
    expect(html).toContain('<canvas id="chart">')
  })

  test('embeds all bundled libraries as <script src>', () => {
    const html = buildHtml(minimal)
    for (const [, lib] of Object.entries(LIBS)) {
      const url = `cdn.jsdelivr.net/npm/${lib.pkg}@${lib.version}/${lib.file}`
      expect(html).toContain(url)
    }
  })

  test('chart config is JSON-serialized into the page IIFE', () => {
    const html = buildHtml({
      chart: { type: 'bar', data: { labels: ['x'], datasets: [{ data: [42] }] } },
    })
    expect(html).toContain('"type":"bar"')
    expect(html).toContain('"data":[42]')
  })

  test('respects width / height / backgroundColor', () => {
    const html = buildHtml({
      chart: { type: 'bar', data: { datasets: [{ data: [1] }] } },
      width: 1234,
      height: 567,
      backgroundColor: '#abcdef',
    })
    expect(html).toContain('width: 1234px')
    expect(html).toContain('height: 567px')
    expect(html).toContain('background: #abcdef')
  })

  test('defaults apply when dimensions/background are omitted', () => {
    const html = buildHtml(minimal)
    expect(html).toContain('width: 800px')
    expect(html).toContain('height: 600px')
    expect(html).toContain('background: white')
  })

  test('injects devicePixelRatio into the rendered config', () => {
    const html = buildHtml({ ...minimal, devicePixelRatio: 3 })
    expect(html).toContain('config.options.devicePixelRatio = 3')
  })

  test('forces animation off', () => {
    const html = buildHtml(minimal)
    expect(html).toContain('config.options.animation = false')
  })

  test('forces responsive / maintainAspectRatio', () => {
    const html = buildHtml(minimal)
    expect(html).toContain('config.options.responsive = true')
    expect(html).toContain('config.options.maintainAspectRatio = false')
  })

  test('installs __chartMessages capture before plugin registration', () => {
    const html = buildHtml(minimal)
    const capIdx = html.indexOf('__chartMessages')
    const regIdx = html.indexOf('Chart.register')
    expect(capIdx).toBeGreaterThan(0)
    expect(regIdx).toBeGreaterThan(0)
    // Capture must be installed first so plugin-registration errors
    // surface through the messages channel.
    expect(capIdx).toBeLessThan(regIdx)
  })

  test('signals __chartRendered=true even if Chart() constructor throws', () => {
    const html = buildHtml(minimal)
    // The IIFE wraps the Chart() call in try/catch and still sets
    // __chartRendered = true afterwards, so renderer.waitForFunction
    // does not time out on a bad config.
    expect(html).toContain('window.__chartRendered = true')
    expect(html).toContain('__chartError')
  })

  test('LIBS table lists Chart.js core', () => {
    expect(LIBS.chartjs.pkg).toBe('chart.js')
    expect(LIBS.chartjs.version).toMatch(/^\d+\.\d+\.\d+/)
  })
})
