// CLI argument parser extracted from src/index.ts so it can be unit
// tested without running main() as a side effect.

/**
 * Flags (long and short names) that always take a value — needed so
 * `render -w -100` parses -100 as the value rather than "next flag"
 * and so truly-boolean flags (none today, but future) are not mistaken
 * for value-takers when the following token happens to start with `-`.
 * Keep this list aligned with the command schemas in index.ts.
 */
export const VALUE_FLAGS = new Set([
  'port', 'p',
  'host',
  'api-key',
  'input', 'i',
  'output', 'o',
  'outdir',
  'width', 'w',
  'height', 'h',
  'device-pixel-ratio',
  'background-color',
  'format', 'f',
  'quality', 'q',
])

export class CliArgError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CliArgError'
  }
}

/**
 * Parse argv-style args into a flag map. Value-bearing flags consume
 * the next token regardless of whether it starts with `-` (so negative
 * numbers work). Unknown flags are collected as booleans. Positional
 * args are ignored — the CLI has none today.
 *
 * Throws CliArgError instead of calling process.exit() so the parser
 * is pure and testable. The entrypoint is responsible for translating
 * the error into an exit code.
 */
export function parseArgs(args: string[]): Record<string, string | boolean> {
  const result: Record<string, string | boolean> = {}
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (!arg.startsWith('-')) continue
    const key = arg.replace(/^-+/, '')
    if (VALUE_FLAGS.has(key)) {
      const next = args[i + 1]
      if (next === undefined) {
        throw new CliArgError(`Missing value for --${key}`)
      }
      result[key] = next
      i++
    } else {
      result[key] = true
    }
  }
  return result
}
