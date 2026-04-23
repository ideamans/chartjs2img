// Generate baseline images via the TS library entry. Called once at
// test setup so every interface compares against the same golden.
import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { renderChart, closeBrowser } from '../../src/lib'
import { FIXTURES } from './fixtures'

async function main() {
  const outdir = join(import.meta.dir, 'baseline')
  mkdirSync(outdir, { recursive: true })

  try {
    for (const fx of FIXTURES) {
      const res = await renderChart({
        chart: fx.config,
        width: fx.width,
        height: fx.height,
        format: 'png',
      })
      const dst = join(outdir, `${fx.id}.png`)
      writeFileSync(dst, res.buffer)
      // Also drop the JSON config next to it for CLI/HTTP tests to consume.
      writeFileSync(
        join(import.meta.dir, 'fixtures', `${fx.id}.json`),
        JSON.stringify(fx.config, null, 2),
      )
      console.log(`baseline: ${fx.id} (${res.buffer.length} bytes)`)
    }
  } finally {
    await closeBrowser()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
