// CLI render / examples — a thin wrapper around the internal render
// pipeline. stdin/stdout + stderr-message plumbing is the only
// CLI-specific concern; chart rendering itself is delegated.
//
// Internal files import directly from source modules; see server.ts
// for the rationale on not routing through ./lib.
import { mkdirSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'path'
import { renderChart, closeBrowser } from './renderer.ts'
import type { Engine, RenderOptions } from './template.ts'
import { EXAMPLES } from './examples.ts'

export interface CliRenderArgs {
  input?: string
  output?: string
  width?: number
  height?: number
  devicePixelRatio?: number
  backgroundColor?: string
  format?: 'png' | 'jpeg'
  quality?: number
  engine?: Engine
  fontFamily?: string
}

/** Write binary data to stdout and resolve once it has been flushed. */
function writeStdout(data: Uint8Array): Promise<void> {
  return new Promise((resolve, reject) => {
    process.stdout.write(data, (err) => (err ? reject(err) : resolve()))
  })
}

export async function cliRender(args: CliRenderArgs): Promise<void> {
  let jsonStr: string

  if (!args.input || args.input === '-') {
    // Runtime-neutral (Node and Bun): no Bun.stdin / Bun.file, so the npm
    // package's `chartjs2img` bin works under plain Node.
    const chunks: Buffer[] = []
    for await (const chunk of process.stdin) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
    }
    jsonStr = Buffer.concat(chunks).toString('utf-8')
  } else {
    jsonStr = await readFile(args.input, 'utf-8')
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
    engine: args.engine,
    fontFamily: args.fontFamily,
  }

  try {
    const result = await renderChart(options)

    // Print chart messages (errors/warnings) to stderr
    for (const msg of result.messages) {
      const prefix = msg.level === 'error' ? 'ERROR' : 'WARN'
      console.error(`[chart ${prefix}] ${msg.message}`)
    }

    if (!args.output || args.output === '-') {
      await writeStdout(result.buffer)
    } else {
      await writeFile(args.output, result.buffer)
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
  engine?: Engine
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
        engine: args.engine,
      })

      await writeFile(filepath, result.buffer)

      // Also write the JSON config alongside
      const jsonPath = join(args.outdir, `${String(i + 1).padStart(2, '0')}-${slugify(ex.title)}.json`)
      await writeFile(jsonPath, JSON.stringify(ex.config, null, 2))

      console.log(`  [${i + 1}/${EXAMPLES.length}] ${filename} (${ex.title})`)
    }

    console.log(`Done. ${EXAMPLES.length} images + JSON configs written to ${args.outdir}/`)
  } finally {
    await closeBrowser()
  }
}
