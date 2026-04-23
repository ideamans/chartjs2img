// Cache layer contract: hash determinism, key-order invariance,
// round-trip storage. TTL and LRU eviction live inside the module
// with module-level constants sourced from env; testing those edges
// would require injecting time/capacity, which is not worth the
// abstraction cost for a small in-memory cache. We test the parts
// that guarantee correctness (hash) and basic usability (set/get).
import { describe, test, expect } from 'bun:test'
import { computeHash, setCache, getCache } from '../../src/cache'
import type { RenderOptions } from '../../src/template'

const sampleChart: Record<string, unknown> = {
  type: 'bar',
  data: { labels: ['A', 'B'], datasets: [{ data: [1, 2] }] },
}

describe('computeHash', () => {
  test('is deterministic for the same input', () => {
    const h1 = computeHash({ chart: sampleChart })
    const h2 = computeHash({ chart: sampleChart })
    expect(h1).toBe(h2)
    expect(h1).toHaveLength(16)
  })

  test('is invariant under object key reordering', () => {
    const a: RenderOptions = {
      chart: { type: 'bar', data: { labels: ['A'], datasets: [{ data: [1] }] } },
      width: 800,
      height: 600,
    }
    const b: RenderOptions = {
      height: 600,
      width: 800,
      chart: { data: { datasets: [{ data: [1] }], labels: ['A'] }, type: 'bar' },
    }
    expect(computeHash(a)).toBe(computeHash(b))
  })

  test('differs when the chart content differs', () => {
    const a = computeHash({ chart: { type: 'bar', data: { datasets: [{ data: [1] }] } } })
    const b = computeHash({ chart: { type: 'bar', data: { datasets: [{ data: [2] }] } } })
    expect(a).not.toBe(b)
  })

  test('differs when dimensions or format differ', () => {
    const base: RenderOptions = { chart: sampleChart }
    const hBase = computeHash(base)
    expect(computeHash({ ...base, width: 1200 })).not.toBe(hBase)
    expect(computeHash({ ...base, height: 900 })).not.toBe(hBase)
    expect(computeHash({ ...base, format: 'jpeg' })).not.toBe(hBase)
    expect(computeHash({ ...base, quality: 50 })).not.toBe(hBase)
    expect(computeHash({ ...base, devicePixelRatio: 1 })).not.toBe(hBase)
    expect(computeHash({ ...base, backgroundColor: 'transparent' })).not.toBe(hBase)
  })

  test('array order IS meaningful (not sorted)', () => {
    // Datasets in a different order mean a different chart; the hash
    // must reflect that.
    const a = computeHash({
      chart: { type: 'bar', data: { datasets: [{ data: [1] }, { data: [2] }] } },
    })
    const b = computeHash({
      chart: { type: 'bar', data: { datasets: [{ data: [2] }, { data: [1] }] } },
    })
    expect(a).not.toBe(b)
  })
})

describe('setCache / getCache', () => {
  test('round-trips buffer and contentType', () => {
    const key = computeHash({ chart: { type: 'bar', data: { datasets: [{ data: [42] }] } } })
    const buf = Buffer.from([1, 2, 3, 4])
    setCache(key, buf, 'image/png')
    const back = getCache(key)
    expect(back).toBeDefined()
    expect(back?.buffer).toEqual(buf)
    expect(back?.contentType).toBe('image/png')
  })

  test('returns undefined for an unknown hash', () => {
    expect(getCache('0000000000000000')).toBeUndefined()
  })
})
