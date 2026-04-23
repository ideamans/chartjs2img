// Regenerate docs/public/diagrams/*.svg from docs/diagrams/*.gg.
//
// Hooked into `docs:dev` and `docs:build` so conceptual diagrams in
// the docs stay in sync with their source. The .gg files are the
// single source of truth; the SVGs are derived artifacts (gitignored
// under docs/public/diagrams/).
//
// Why a TS script instead of inline shell: we want to skip regen if
// the SVG is already newer than the .gg source, so `docs:dev`
// (hot-loop) doesn't pay the spawn cost on every restart.
import { readdirSync, mkdirSync, statSync, existsSync } from 'fs'
import { join, dirname, basename } from 'path'
import { fileURLToPath } from 'url'

const here = dirname(fileURLToPath(import.meta.url))
const root = dirname(here)
const srcDir = join(root, 'docs', 'diagrams')
const outDir = join(root, 'docs', 'public', 'diagrams')

function mtime(p: string): number {
  try {
    return statSync(p).mtimeMs
  } catch {
    return 0
  }
}

async function renderOne(ggPath: string, svgPath: string): Promise<void> {
  const proc = Bun.spawn(['gg', ggPath, '-o', svgPath], {
    stdout: 'inherit',
    stderr: 'inherit',
  })
  const code = await proc.exited
  if (code !== 0) {
    throw new Error(`gg failed (exit ${code}) for ${ggPath}`)
  }
}

async function main(): Promise<void> {
  if (!existsSync(srcDir)) {
    console.log(`[docs:diagrams] no source dir at ${srcDir}, nothing to do`)
    return
  }
  mkdirSync(outDir, { recursive: true })

  const entries = readdirSync(srcDir).filter((f) => f.endsWith('.gg'))
  if (entries.length === 0) {
    console.log('[docs:diagrams] no .gg files found')
    return
  }

  let regenerated = 0
  let skipped = 0
  for (const entry of entries) {
    const ggPath = join(srcDir, entry)
    const svgPath = join(outDir, basename(entry, '.gg') + '.svg')
    if (mtime(svgPath) >= mtime(ggPath)) {
      skipped++
      continue
    }
    process.stdout.write(`[docs:diagrams] ${entry} → public/diagrams/${basename(svgPath)}\n`)
    await renderOne(ggPath, svgPath)
    regenerated++
  }
  console.log(`[docs:diagrams] ${regenerated} regenerated, ${skipped} up-to-date`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
