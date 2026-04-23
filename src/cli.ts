// CLI render / examples — a thin wrapper around the library API in
// src/lib.ts. stdin/stdout + stderr-message plumbing is the only
// CLI-specific concern; chart rendering itself is delegated.
import { mkdirSync } from 'fs'
import { join } from 'path'
import { renderChart, closeBrowser } from './lib'
import type { RenderOptions } from './lib'
import { EXAMPLES } from './examples'

export interface CliRenderArgs {
  input?: string
  output?: string
  width?: number
  height?: number
  devicePixelRatio?: number
  backgroundColor?: string
  format?: 'png' | 'jpeg'
  quality?: number
}

export async function cliRender(args: CliRenderArgs): Promise<void> {
  let jsonStr: string

  if (!args.input || args.input === '-') {
    const chunks: Uint8Array[] = []
    const reader = Bun.stdin.stream().getReader()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }
    jsonStr = Buffer.concat(chunks).toString('utf-8')
  } else {
    const file = Bun.file(args.input)
    jsonStr = await file.text()
  }

  let chart: Record<string, unknown>
  try {
    chart = JSON.parse(jsonStr)
  } catch {
    console.error('Error: Invalid JSON input')
    process.exit(1)
  }

  const options: RenderOptions = {
    chart,
    width: args.width,
    height: args.height,
    devicePixelRatio: args.devicePixelRatio,
    backgroundColor: args.backgroundColor,
    format: args.format,
    quality: args.quality,
  }

  try {
    const result = await renderChart(options)

    // Print chart messages (errors/warnings) to stderr
    for (const msg of result.messages) {
      const prefix = msg.level === 'error' ? 'ERROR' : 'WARN'
      console.error(`[chart ${prefix}] ${msg.message}`)
    }

    if (!args.output || args.output === '-') {
      await Bun.write(Bun.stdout, result.buffer)
    } else {
      await Bun.write(args.output, result.buffer)
      console.error(`Written to ${args.output} (hash: ${result.hash})`)
    }
  } finally {
    await closeBrowser()
  }
}

export interface CliExamplesArgs {
  outdir: string
  format?: 'png' | 'jpeg'
  quality?: number
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function cliExamples(args: CliExamplesArgs): Promise<void> {
  const ext = args.format === 'jpeg' ? 'jpg' : 'png'

  mkdirSync(args.outdir, { recursive: true })

  console.log(`Generating ${EXAMPLES.length} examples to ${args.outdir}/ (${ext})`)

  try {
    for (let i = 0; i < EXAMPLES.length; i++) {
      const ex = EXAMPLES[i]
      const filename = `${String(i + 1).padStart(2, '0')}-${slugify(ex.title)}.${ext}`
      const filepath = join(args.outdir, filename)

      const result = await renderChart({
        chart: ex.config,
        width: ex.width,
        height: ex.height,
        format: args.format ?? 'png',
        quality: args.quality,
      })

      await Bun.write(filepath, result.buffer)

      // Also write the JSON config alongside
      const jsonPath = join(args.outdir, `${String(i + 1).padStart(2, '0')}-${slugify(ex.title)}.json`)
      await Bun.write(jsonPath, JSON.stringify(ex.config, null, 2))

      console.log(`  [${i + 1}/${EXAMPLES.length}] ${filename} (${ex.title})`)
    }

    console.log(`Done. ${EXAMPLES.length} images + JSON configs written to ${args.outdir}/`)
  } finally {
    await closeBrowser()
  }
}
