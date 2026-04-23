#!/usr/bin/env bun
/**
 * Regenerate docs/public/examples/NN-<slug>.{png,json} from src/examples.ts.
 *
 * This is a thin wrapper around `chartjs2img examples`. The docs site
 * references the PNGs at /examples/... (served by VitePress from
 * docs/public/), and the JSONs are shown inline inside the gallery
 * pages.
 *
 * Run via `bun run docs:examples`. Re-run after editing src/examples.ts
 * or after upgrading any bundled plugin.
 *
 * Output directory is gitignored — the site's CI/dev build regenerates
 * it. Never commit the PNGs.
 */
import { cliExamples } from '../src/cli'

const OUT_DIR = 'docs/public/examples'

await cliExamples({
  outdir: OUT_DIR,
  format: 'png',
})

// cliExamples calls closeBrowser() in a finally block, so the process
// exits naturally once the 18 renders are done.
