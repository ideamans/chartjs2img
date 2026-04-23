// CLI arg parser contract. The cases here lock in the behaviors
// the CLI depends on: value flags consume the next token regardless
// of its content (so negative numbers work — P1-5 regression), long
// and short aliases reach the same result map, missing values throw
// a typed CliArgError.
import { describe, test, expect } from 'bun:test'
import { parseArgs, CliArgError, VALUE_FLAGS } from '../../src/cli-args'

describe('parseArgs', () => {
  test('empty input → empty map', () => {
    expect(parseArgs([])).toEqual({})
  })

  test('long value flag with value', () => {
    expect(parseArgs(['--port', '3000'])).toEqual({ port: '3000' })
  })

  test('short value flag with value', () => {
    expect(parseArgs(['-p', '3000'])).toEqual({ p: '3000' })
  })

  test('multiple value flags', () => {
    expect(parseArgs(['-w', '800', '-h', '600', '--format', 'jpeg'])).toEqual({
      w: '800',
      h: '600',
      format: 'jpeg',
    })
  })

  test('negative numeric values are consumed, not mistaken for flags (P1-5)', () => {
    // The previous parser treated `-100` as the next flag and set
    // width=true. Regression guard.
    expect(parseArgs(['-w', '-100'])).toEqual({ w: '-100' })
  })

  test('missing value for a value flag throws CliArgError', () => {
    expect(() => parseArgs(['--port'])).toThrow(CliArgError)
    expect(() => parseArgs(['--port'])).toThrow(/Missing value for --port/)
  })

  test('unknown flag without value is treated as boolean true', () => {
    expect(parseArgs(['--some-toggle'])).toEqual({ 'some-toggle': true })
  })

  test('positional args are ignored (CLI has none)', () => {
    expect(parseArgs(['positional', '--port', '80'])).toEqual({ port: '80' })
  })

  test('adjacent flags: value flag, then another flag', () => {
    // After consuming `--port 3000`, the next iteration sees `--host`
    // as its own flag.
    expect(parseArgs(['--port', '3000', '--host', '127.0.0.1'])).toEqual({
      port: '3000',
      host: '127.0.0.1',
    })
  })

  test('all expected long flag names are in VALUE_FLAGS', () => {
    // Aligns with the CLI help text.
    for (const name of [
      'port', 'host', 'api-key', 'input', 'output', 'outdir', 'width',
      'height', 'device-pixel-ratio', 'background-color', 'format', 'quality',
    ]) {
      expect(VALUE_FLAGS.has(name)).toBe(true)
    }
  })

  test('all expected short flag names are in VALUE_FLAGS', () => {
    for (const name of ['p', 'i', 'o', 'w', 'h', 'f', 'q']) {
      expect(VALUE_FLAGS.has(name)).toBe(true)
    }
  })
})
