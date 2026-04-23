---
title: Gallery
description: 18 Chart.js charts rendered by chartjs2img, grouped by category. Click through for the source JSON.
---

# Gallery

18 example charts, rendered by chartjs2img itself. Every image below
is regenerated from `src/examples.ts` via `bun run docs:examples`, so
the images you see here are exactly what the live service produces.

Each page shows the rendered PNG plus the Chart.js configuration JSON.
Copy, tweak, POST to `/render`.

## Categories

| Category                                   | Charts                                                                 |
| ------------------------------------------ | ---------------------------------------------------------------------- |
| [Basic chart types](./basic)               | bar, line, pie, doughnut, radar, polarArea, scatter, bubble, horizontal bar |
| [Composite charts](./composite)            | filled area, stacked bar, mixed bar + line                             |
| [Labels & annotation](./decorations)       | data labels, annotation (line / box / point), gradient fills, zoom framing, time-series axis |
| [Exotic plugins](./exotic)                 | treemap, matrix / heatmap, sankey, wordcloud, venn / euler, force-directed graph, tidy tree, choropleth skeleton |
| [Sizing](./sizing)                         | small 400×300 and wide 1200×400 canvases                               |
| [Internationalization](./i18n)             | Japanese labels with Noto Sans CJK                                     |

## How these are produced

```bash
# One-shot renders everything into docs/public/examples/
bun run docs:examples

# Same renders show up in the built-in live gallery
bun run dev     # then open http://localhost:3000/examples
```

The `/examples` endpoint on a running server produces the same images
from the same source. If you want them embedded in your own site, the
HTTP API (`GET /render?chart=...`) or the cache URL pattern
(`/cache/:hash`) is usually easier than scraping the docs site.

## Adding your own

See [Developer Guide → Adding a Chart.js plugin](/en/developer/adding-plugin)
for the full recipe. In short: append an entry to `EXAMPLES` in
`src/examples.ts`, then `bun run docs:examples`. The new chart shows up
in both the CLI output directory and the gallery.
