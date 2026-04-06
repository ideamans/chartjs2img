// LLM-oriented documentation — one module per file, concatenated on output.
// To add/remove a plugin, add/remove its import and entry in `docs`.

import { doc as usage } from './usage'
import { doc as chartjsCore } from './chartjs-core'
import { doc as pluginDatalabels } from './plugin-datalabels'
import { doc as pluginAnnotation } from './plugin-annotation'
import { doc as pluginZoom } from './plugin-zoom'
import { doc as pluginGradient } from './plugin-gradient'
import { doc as chartTreemap } from './chart-treemap'
import { doc as chartMatrix } from './chart-matrix'
import { doc as chartSankey } from './chart-sankey'
import { doc as chartWordcloud } from './chart-wordcloud'
import { doc as chartGeo } from './chart-geo'
import { doc as chartGraph } from './chart-graph'
import { doc as chartVenn } from './chart-venn'
import { doc as adapterDayjs } from './adapter-dayjs'

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
  adapterDayjs,
]

export function getLlmDocs(): string {
  return docs.map((d) => d.trim()).join('\n\n')
}
