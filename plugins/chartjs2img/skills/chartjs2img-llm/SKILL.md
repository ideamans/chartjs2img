---
name: chartjs2img-llm
description: Load the full Chart.js + plugin reference into the current agent context. Use when the user is about to author Chart.js configurations, asks what options a plugin accepts, or needs the canonical list of chart types / datalabels / annotation / treemap / sankey / matrix / geo / graph / venn / dayjs-adapter options. Runs `chartjs2img llm` and returns ~1400 lines of structured Markdown.
license: MIT
compatibility: Requires the `chartjs2img` CLI on PATH. Output is self-contained — no network access needed.
allowed-tools: Bash(chartjs2img:*) Bash(bun:*) Read
---

# chartjs2img-llm

Pull the canonical Chart.js + plugin reference into context so subsequent turns can author configs without guessing.

## When to call this

- At the start of a session that will author Chart.js configs.
- When the user asks "what options does `<plugin>` accept?"
- When `/chartjs2img-render` returns `X-Chart-Messages` and you need to cross-check option shapes.
- When upgrading: the LLM reference regenerates from `src/llm-docs/` on every release, so the output reflects the exact versions bundled in the binary.

## Usage

```bash
# Full reference to stdout
chartjs2img llm

# Save to a file for later reference
chartjs2img llm > /tmp/chartjs2img-reference.md
wc -l /tmp/chartjs2img-reference.md   # ~1400 lines

# Extract one section
chartjs2img llm | sed -n '/^## Datalabels/,/^## /p'
```

## What the output covers

Each section uses `## <module>` as its H2 heading. Typical sections:

1. **Usage** — JSON input shape (CLI vs HTTP), JSON constraint (no functions), `chartjs2img llm` itself.
2. **Chart.js core** — every built-in type, dataset properties, scales, `title`, `legend`, `tooltip`.
3. **chartjs-plugin-datalabels** — `display`, `anchor`, `align`, `color`, `font`. Defaults to OFF in chartjs2img.
4. **chartjs-plugin-annotation** — `line`, `box`, `label`, `point`, `polygon`, `ellipse` annotation types.
5. **chartjs-plugin-zoom** — initial-range only (no interactivity in static renders).
6. **chartjs-plugin-gradient** — gradient fills via config, no custom canvas code.
7. **chartjs-chart-treemap** — hierarchical block charts.
8. **chartjs-chart-matrix** — heatmaps.
9. **chartjs-chart-sankey** — flow diagrams.
10. **chartjs-chart-wordcloud** — word clouds.
11. **chartjs-chart-geo** — choropleth / bubbleMap.
12. **chartjs-chart-graph** — graph / forceDirectedGraph / dendrogram / tree.
13. **chartjs-chart-venn** — venn / euler.
14. **chartjs-adapter-dayjs-4** — time-scale adapter for `scales.x.type: "time"`.

Each section is self-contained: an option table (property path, type, default, description) plus at least one JSON example you can copy into `chartjs2img render`.

## How to use the output in context

Once loaded, treat the output as authoritative for the **currently bundled versions**. If the user asks a question the reference doesn't answer, check upstream docs, but prefer the reference for anything that's there.

When producing a config, cross-check against the reference's example for the same chart type before handing back the result. That almost always finds missing required fields.

## When the reference is missing something

If `chartjs2img llm` lacks coverage for a plugin option the user needs:

1. Fall back to the upstream plugin's own docs (linked in each section).
2. Flag the gap to the user so they can file a doc issue against chartjs2img.
3. Do not hallucinate options — a best-guess option will silently break the render.

## Caveats

- The disclaimer at the top of `chartjs2img llm` says the doc may contain inaccuracies. When a Chart.js error message contradicts the reference, trust the error message.
- Callback-based options (`ticks.callback`, `formatter`) appear in the reference for completeness but **cannot be expressed in JSON** over the HTTP / CLI. The reference notes this.
- The reference reflects what's bundled — plugin versions don't drift at runtime. Upgrade chartjs2img itself to pick up a newer plugin version.
