// EXAMPLES data integrity. The gallery, the CLI `examples` subcommand,
// and the docs examples builder all consume this array. Broken entries
// cause silent rendering failures in the gallery — this test catches
// shape errors before they ship.
import { describe, test, expect } from 'bun:test'
import { EXAMPLES } from '../../src/examples'

describe('EXAMPLES array', () => {
  test('has entries', () => {
    expect(EXAMPLES.length).toBeGreaterThan(0)
  })

  test('every entry has a non-empty title and description', () => {
    for (const ex of EXAMPLES) {
      expect(typeof ex.title).toBe('string')
      expect(ex.title.length).toBeGreaterThan(0)
      expect(typeof ex.description).toBe('string')
      expect(ex.description.length).toBeGreaterThan(0)
    }
  })

  test('every entry has a chart config with a type and data', () => {
    for (const ex of EXAMPLES) {
      expect(ex.config).toBeDefined()
      expect(typeof ex.config).toBe('object')
      expect('type' in ex.config).toBe(true)
      expect('data' in ex.config).toBe(true)
    }
  })

  test('titles are unique (slug collisions would overwrite output files)', () => {
    const seen = new Set<string>()
    for (const ex of EXAMPLES) {
      expect(seen.has(ex.title)).toBe(false)
      seen.add(ex.title)
    }
  })

  test('every config is JSON-serializable end to end (P0-4 contract)', () => {
    // If anyone adds a function value (callback, formatter, etc.) it
    // will vanish in transit to the browser and the example will
    // render differently from its source. Detect it here.
    function walk(v: unknown, path: string): void {
      if (v === null) return
      if (typeof v === 'function') {
        throw new Error(`function value at ${path} — not JSON-serializable`)
      }
      if (typeof v === 'symbol') {
        throw new Error(`symbol at ${path} — not JSON-serializable`)
      }
      if (typeof v !== 'object') return
      if (Array.isArray(v)) {
        v.forEach((item, i) => walk(item, `${path}[${i}]`))
        return
      }
      for (const [k, child] of Object.entries(v as Record<string, unknown>)) {
        walk(child, `${path}.${k}`)
      }
    }
    for (const ex of EXAMPLES) {
      expect(() => walk(ex.config, ex.title)).not.toThrow()
    }
  })

  test('width / height, when present, are positive integers', () => {
    for (const ex of EXAMPLES) {
      if (ex.width !== undefined) {
        expect(Number.isInteger(ex.width)).toBe(true)
        expect(ex.width).toBeGreaterThan(0)
      }
      if (ex.height !== undefined) {
        expect(Number.isInteger(ex.height)).toBe(true)
        expect(ex.height).toBeGreaterThan(0)
      }
    }
  })
})
