---
title: Adding LLM docs
description: How to extend the chartjs2img llm reference output - file format, registration, conventions.
---

# Adding LLM docs

`chartjs2img llm` prints a ~1400-line Markdown reference that teaches
an LLM how to write Chart.js configs for chartjs2img. Each section
lives in one `src/llm-docs/*.ts` file.

## When to add one

- You added a Chart.js plugin in [Adding a Chart.js plugin](./adding-plugin). Each plugin gets its own doc file.
- You noticed the existing reference misses a common foot-gun that agents keep tripping on.
- You upgraded a plugin version and its option shape changed.

## File shape

A `llm-docs/*.ts` file is a single-purpose ESM module that exports a
string called `doc`:

```ts
// src/llm-docs/plugin-example.ts
export const doc = `
## Example plugin (chartjs-plugin-example)

<one-paragraph summary of what the plugin does>

### Options

| Option                                | Type     | Default | Description              |
| ------------------------------------- | -------- | ------- | ------------------------ |
| \`options.plugins.example.enabled\`   | boolean  | \`false\` | Master toggle         |
| \`options.plugins.example.color\`     | string   | -       | CSS color              |

### JSON example

\`\`\`json
{
  "type": "bar",
  "data": { "labels": ["A"], "datasets": [{ "data": [1] }] },
  "options": {
    "plugins": {
      "example": { "enabled": true, "color": "#f39c55" }
    }
  }
}
\`\`\`

### Caveats

- \`enabled: true\` is required; the plugin is off by default.
- Does not support \`type: "treemap"\`.
`
```

Escaping rules:

- The file is a template literal, so you escape backticks (`` \` ``).
- Inside code-fence JSON, the template literal's `\n` becomes a real newline — you're just writing Markdown inside a JS string.
- TypeScript is not type-checking the Markdown; keep it consistent by hand.

## Register it

`src/llm-docs/index.ts` is the aggregator:

```ts
import { doc as pluginExample } from './plugin-example'

const docs = [
  // ...existing entries...
  pluginExample,
]
```

Order matters — `getLlmDocs()` joins entries with `\n\n` in array
order. Current convention:

1. `usage` (always first — sets context)
2. `chartjsCore`
3. Visual plugins (datalabels, annotation, zoom, gradient)
4. Chart-type plugins (treemap, matrix, sankey, wordcloud, geo, graph, venn)
5. Date adapter (`adapterDayjs`) last

Slot your new entry into the matching group.

## Conventions

**Headings.** Start each file with `## <plugin display name>` (H2, not H1 — the
bundle has no top-level H1). Sub-sections use H3.

**Option tables.** One big table per plugin. Put the full path in backticks
(`options.plugins.foo.bar`). Type column is free-form (prose is fine:
"function or string"). Mark required fields by writing `*required*` in
the Default column.

**Examples.** Always include at least one working JSON example. Keep
data tiny — 2-3 points is enough to show the shape. The example should
be copy-pasteable into `chartjs2img render`.

**Caveats.** A bullet list of things LLMs keep getting wrong. Lead with
the most common. "This plugin must be explicitly enabled" is a common
first bullet.

**No callbacks / functions.** Chart.js options accept functions
(`ticks.callback`, etc.) in the runtime API, but the HTTP/CLI input is
JSON. Mention when a plugin can't be fully expressed in JSON.

**Avoid unnecessary mentions of chartjs2img.** The doc is meant to
teach Chart.js config, not chartjs2img internals. Keep plugin docs
transferable.

## Verify

```bash
# 1. Type check
bun run typecheck

# 2. Print and eyeball
bun run cli -- llm | less

# 3. Grep for your new section
bun run cli -- llm | grep -A 20 "Example plugin"

# 4. Check total length (a reasonable doc is ~30-200 lines per plugin)
bun run cli -- llm | wc -l
```

## What NOT to put here

- **Release notes / changelog.** This is evergreen reference, not a history.
- **Server operations.** Env vars, Docker config, etc. belong in the [User Guide](../guide/).
- **Claude-specific instructions.** Agent Skills files (SKILL.md in `plugins/chartjs2img/skills/*`) are the right home for those — a context7 / Claude-only audience. `chartjs2img llm` is host-agnostic.

See the **Phase 2-B** section of PLAN.md for the upcoming
auto-generation of `docs/public/llms-full.txt` that will concatenate
the LLM docs with the guide pages.
