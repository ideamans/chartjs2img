#!/usr/bin/env bun
/**
 * Regenerate docs/public/examples/{NN-<slug>,<slug>}.{png,json} from
 * src/examples.ts.
 *
 * The docs site references examples two ways:
 *   - Gallery pages (historically) and <Example name="…"/> widgets use
 *     the **slug-only** filenames (`bar-chart.png`, `bar-chart.json`).
 *   - The `chartjs2img examples` CLI ships **numbered** filenames
 *     (`01-bar-chart.png`) so they sort in the documented order — those
 *     are also written here for parity with the CLI output and for any
 *     downstream tooling that still expects the numbered form.
 *
 * Output directory is gitignored; CI / dev build regenerates it.
 */
import { mkdirSync, writeFileSync, copyFileSync } from 'fs'
import { join } from 'path'
import { EXAMPLES } from '../src/examples'
import { renderChart, closeBrowser } from '../src/renderer'

const OUT_DIR = 'docs/public/examples'

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function main(): Promise<void> {
  mkdirSync(OUT_DIR, { recursive: true })

  console.log(`Rendering ${EXAMPLES.length} examples to ${OUT_DIR}/`)

  const manifest: Record<string, { title: string; description: string; file: string; width: number; height: number }> = {}

  for (let i = 0; i < EXAMPLES.length; i++) {
    const ex = EXAMPLES[i]
    const slug = slugify(ex.title)
    const nn = String(i + 1).padStart(2, '0')
    const numberedBase = `${nn}-${slug}`

    const pngPath = join(OUT_DIR, `${numberedBase}.png`)
    const jsonPath = join(OUT_DIR, `${numberedBase}.json`)
    const slugPng = join(OUT_DIR, `${slug}.png`)
    const slugJson = join(OUT_DIR, `${slug}.json`)

    const result = await renderChart({
      chart: ex.config,
      width: ex.width,
      height: ex.height,
      format: 'png',
    })

    writeFileSync(pngPath, result.buffer)
    writeFileSync(jsonPath, JSON.stringify(ex.config, null, 2))
    // Slug-only duplicates for <Example name="slug" /> lookups. Copy
    // instead of symlink so the output survives zip-based deployment
    // pipelines that don't preserve symlinks.
    copyFileSync(pngPath, slugPng)
    copyFileSync(jsonPath, slugJson)

    manifest[slug] = {
      title: ex.title,
      description: ex.description,
      file: numberedBase,
      width: ex.width ?? 800,
      height: ex.height ?? 600,
    }

    console.log(`  [${i + 1}/${EXAMPLES.length}] ${slug}`)
  }

  writeFileSync(join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))

  await closeBrowser()
  console.log(`Done. Wrote manifest.json with ${EXAMPLES.length} entries.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
