// Custom-font support for the skia engine: registerFonts / getFontLibrary
// (same skia-canvas instance the engine renders with) + the fontFamily render
// option. Uses @fontsource/noto-sans-jp (a devDependency) as a real woff2 font.
import { describe, test, expect } from 'bun:test'
import { createRequire } from 'node:module'
import { computeHash } from '../../src/cache'
import { registerFonts, getFontLibrary } from '../../src/lib'
import { renderChart } from '../../src/renderer'

const require = createRequire(import.meta.url)
const NOTO_JP = require.resolve('@fontsource/noto-sans-jp/files/noto-sans-jp-japanese-400-normal.woff2')

describe('font registration', () => {
  test('registerFonts loads a woff2 onto the engine font library', async () => {
    await registerFonts({ 'Test Noto JP': [NOTO_JP] })
    const lib = await getFontLibrary()
    expect(lib.has('Test Noto JP')).toBe(true)
    expect(lib.families).toContain('Test Noto JP')
  })
})

describe('fontFamily option', () => {
  test('cache hash depends on fontFamily', () => {
    const base = { chart: { type: 'bar', data: { labels: ['a'], datasets: [{ data: [1] }] } } }
    expect(computeHash({ ...base, fontFamily: 'A' })).not.toBe(computeHash({ ...base, fontFamily: 'B' }))
    // Omitting it hashes the same as the empty default.
    expect(computeHash(base)).toBe(computeHash({ ...base, fontFamily: '' }))
  })

  test('renders Japanese via a registered family with no error messages', async () => {
    await registerFonts({ 'Noto Sans JP Test': [NOTO_JP] })
    const res = await renderChart({
      chart: {
        type: 'bar',
        data: { labels: ['東京', '大阪'], datasets: [{ label: '売上', data: [12, 19] }] },
        options: { plugins: { title: { display: true, text: '日本語タイトル' } } },
      },
      engine: 'skia',
      fontFamily: 'Noto Sans JP Test',
      width: 400,
      height: 260,
    })
    expect(res.buffer.subarray(0, 4).toString('hex')).toBe('89504e47') // PNG
    expect(res.buffer.length).toBeGreaterThan(1000)
    expect(res.messages.filter((m) => m.level === 'error')).toHaveLength(0)
  })
})
