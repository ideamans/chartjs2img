---
title: chartjs2img llm
description: Reference for the chartjs2img llm CLI subcommand - the one-shot Chart.js + plugin reference that teaches an agent everything needed to author valid configs.
---

# CLI reference — `chartjs2img llm`

This is a **reference page**, not a tutorial. Start with one of the
tutorials ([Claude plugin](./claude-plugin) / [`gh skill`](./gh-skill)
/ [context7](./context7)) if you haven't installed anything yet.

One `chartjs2img` subcommand exists specifically for LLM consumption:
`chartjs2img llm`. It prints a self-contained Markdown reference of
Chart.js core plus every bundled plugin. Pipe it into your agent's
context on session start and configs come out right first try.

## Usage

```sh
chartjs2img llm
```

- No network access.
- No arguments.
- Stdout only.

The output covers:

- **Usage guide** — how to invoke chartjs2img (CLI vs HTTP), input JSON shape, constraints (JSON only, no functions), and caveats.
- **Chart.js core** — all 8 built-in chart types (`bar`, `line`, `pie`, `doughnut`, `radar`, `polarArea`, `scatter`, `bubble`), dataset properties, scales, and the `title` / `legend` / `tooltip` plugin option trees.
- **Bundled plugin options** — 12 sections:
  - `chartjs-plugin-datalabels`
  - `chartjs-plugin-annotation`
  - `chartjs-plugin-zoom`
  - `chartjs-plugin-gradient`
  - `chartjs-chart-treemap`
  - `chartjs-chart-matrix`
  - `chartjs-chart-sankey`
  - `chartjs-chart-wordcloud`
  - `chartjs-chart-geo`
  - `chartjs-chart-graph`
  - `chartjs-chart-venn`
  - `chartjs-adapter-dayjs-4`

Each section includes option tables (property path, type, default,
description) and a JSON example.

The Markdown is regenerated from source (`src/llm-docs/*.ts`) on
every build, so it can never drift from the implementation.

## Output shape at a glance

Approximate structure:

```
# Usage

<input JSON shape, HTTP vs CLI, JSON constraint, error feedback, exit codes>

## Chart.js core (chart.js@4.4.9)

<type, data, datasets, options, scales, title, legend, tooltip>

## Datalabels (chartjs-plugin-datalabels)

<display, anchor, align, color, font — including the chartjs2img-specific
 "off by default" policy>

## Annotation (chartjs-plugin-annotation)

<line, box, label, point, polygon, ellipse>

## Zoom (chartjs-plugin-zoom)

...

## Gradient (chartjs-plugin-gradient)

...

<plus the 7 additional chart-type plugins and the date adapter>
```

Total output: ~1400 lines, ~135 KB. Fits comfortably in modern
context windows.

## Agent prompt templates

### Minimal — opening turn

```text
You are going to author Chart.js configurations that chartjs2img will
render to images. The complete reference follows. When you produce a
JSON config:
1. Validate with `chartjs2img render -i <file> -o /tmp/check.png 2> /tmp/check.err`.
2. If /tmp/check.err is non-empty, fix and retry.
3. Report the final JSON plus the rendered image path.

---
<paste output of `chartjs2img llm`>
---
```

### Richer — with explicit gotchas

```text
<above>

Gotchas to remember:
- JSON has no functions — do not use `options.scales.y.ticks.callback` or `datalabels.formatter`.
- Animation is forced OFF internally — don't propose animated configs.
- Datalabels is disabled by default — set `options.plugins.datalabels.display: true` to show labels.
- Time-series axes need `"type": "time"` — the dayjs adapter is bundled.
```

## Piping into standard LLM CLIs

### OpenAI / generic `llm` CLI

```sh
chartjs2img llm \
  | llm -s "Generate a Chart.js config for monthly sales, Jan-Jun, values 12 19 3 5 2 15"
```

### Clipboard (macOS)

```sh
chartjs2img llm | pbcopy
```

Then paste into your agent's system-prompt box.

### File

```sh
chartjs2img llm > /tmp/chartjs2img-reference.md
```

Re-use across sessions.

## Relationship to other AI channels

- **`llms-full.txt`** on the docs site has a superset — it appends
  every docs/en/ Markdown page to the same reference. Use it if your
  agent wants both the reference and the guide pages in one payload.
- **context7** retrieves the same content via MCP when a full-bundle
  is too big for your context window.
- **SKILL.md** for `chartjs2img-llm` wraps this CLI call for Agent
  Skills-compatible hosts; the skill body explains when to call it.

Whichever channel an agent uses, the actual content is derived from
the same `src/llm-docs/*.ts` files, so consistency is guaranteed.

## Extending

To add / change what `chartjs2img llm` outputs, edit the relevant file
under `src/llm-docs/`. See the [Developer Guide → Adding LLM docs](/en/developer/adding-llm-doc)
for the full format.

## Troubleshooting

**`chartjs2img: command not found`** — install the binary first. See
[Install](/en/guide/install) or run `/chartjs2img-install` if you have
the Claude plugin.

**Output is empty** — that would be a bug; file an issue. The
aggregator always has at least the `usage` section.

**Output looks outdated** — check `chartjs2img --version`. Each
release rebuilds `src/llm-docs/` from the pinned plugin versions in
`src/template.ts`; old binaries reflect old plugin versions.

## See also

- [AI Guide overview](./) — pick a tutorial.
- [llms.txt](./llms-txt) — the same reference served as a static file.
- [Developer Guide → Adding LLM docs](/en/developer/adding-llm-doc) — how to extend the output.
