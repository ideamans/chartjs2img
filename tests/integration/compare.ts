// Pixel-diff helper using ImageMagick's `compare -metric AE`.
// Returns the fraction of pixels that differ (0..1), with a small fuzz
// tolerance to absorb anti-aliasing jitter across Chromium launches.
import { $ } from 'bun'

export interface DiffResult {
  differingPixels: number
  totalPixels: number
  fraction: number
}

/**
 * Compare two PNGs and return the fraction of pixels that differ beyond
 * a 1% color-distance fuzz. Uses ImageMagick's `compare -metric AE`.
 * ImageMagick writes the differing-pixel count to stderr and exits
 * with status 1 when the images differ, so we swallow the non-zero
 * exit rather than treat it as an error.
 */
export async function imageDiffFraction(a: string, b: string): Promise<DiffResult> {
  const res = await $`compare -metric AE -fuzz 1% ${a} ${b} null:`.nothrow().quiet()
  // `compare` prints the AE count to stderr.
  const stderr = res.stderr.toString().trim()
  // Expect a bare integer (possibly with an "e+N" suffix if huge).
  const differingPixels = Number(stderr.split(/\s+/)[0])
  if (!Number.isFinite(differingPixels)) {
    throw new Error(`Unexpected compare stderr: ${stderr}`)
  }

  // Dimensions via `identify`.
  const id = await $`identify -format "%w %h" ${a}`.quiet()
  const [w, h] = id.stdout.toString().trim().split(/\s+/).map(Number)
  const totalPixels = w * h
  return { differingPixels, totalPixels, fraction: differingPixels / totalPixels }
}
