// Integration-test fixtures: a representative subset of the built-in
// examples. Keeping this small trades coverage for runtime — 5 charts
// × 3 interfaces = 15 renders, ~30-60s total on local Chromium.
//
// Selection criteria: cover basic (bar), multi-series (line), circular
// (pie), scatter coords, and plugin-dependent (datalabels). If a
// regression is specific to one of the untouched types, the same
// refactor risk almost always shows up in one of these too.
import { EXAMPLES } from '../../src/examples'

export interface Fixture {
  id: string
  title: string
  config: Record<string, unknown>
  width?: number
  height?: number
}

const PICKED_TITLES = [
  'Bar Chart',
  'Line Chart',
  'Pie Chart',
  'Scatter Plot',
  'Bar with Data Labels',
]

export const FIXTURES: Fixture[] = PICKED_TITLES.map((title) => {
  const ex = EXAMPLES.find((e) => e.title === title)
  if (!ex) throw new Error(`Fixture not found in EXAMPLES: ${title}`)
  return {
    id: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    title: ex.title,
    config: ex.config,
    width: ex.width,
    height: ex.height,
  }
})
