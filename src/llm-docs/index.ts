// LLM-oriented documentation — one module per file, concatenated on output.
// To add/remove a plugin, add/remove its import and entry in `docs`.

import { doc as usage } from './usage.ts'
import { doc as chartjsCore } from './chartjs-core.ts'
import { doc as pluginDatalabels } from './plugin-datalabels.ts'
import { doc as pluginAnnotation } from './plugin-annotation.ts'
import { doc as pluginZoom } from './plugin-zoom.ts'
import { doc as pluginGradient } from './plugin-gradient.ts'
import { doc as chartTreemap } from './chart-treemap.ts'
import { doc as chartMatrix } from './chart-matrix.ts'
import { doc as chartSankey } from './chart-sankey.ts'
import { doc as chartWordcloud } from './chart-wordcloud.ts'
import { doc as chartGeo } from './chart-geo.ts'
import { doc as chartGraph } from './chart-graph.ts'
import { doc as chartVenn } from './chart-venn.ts'
import { doc as adapterDateFns } from './adapter-date-fns.ts'

const docs = [
  usage,
  chartjsCore,
  pluginDatalabels,
  pluginAnnotation,
  pluginZoom,
  pluginGradient,
  chartTreemap,
  chartMatrix,
  chartSankey,
  chartWordcloud,
  chartGeo,
  chartGraph,
  chartVenn,
  adapterDateFns,
]

export function getLlmDocs(): string {
  return docs.map((d) => d.trim()).join('\n\n')
}
