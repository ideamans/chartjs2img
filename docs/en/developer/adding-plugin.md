---
title: Adding a Chart.js plugin
description: Wire a new Chart.js plugin into chartjs2img - the three-file change and how to verify.
---

# Adding a Chart.js plugin

You want to bundle another Chart.js ecosystem plugin (a new chart type,
a new decorator) so users can reference it in their config without
extra setup.

## The three-file change

### 1. Add it to `template.ts`

In `src/template.ts`, extend the `LIBS` object:

```ts
export const LIBS = {
  // ...existing entries...
  myNewPlugin: {
    pkg: 'chartjs-chart-mynew',      // npm package name
    version: '1.2.3',                 // pin the exact version
    file: 'dist/chartjs-chart-mynew.min.js', // UMD build path
  },
} as const
```

`Object.values(LIBS).map(cdnUrl)` in the template automatically emits a
`<script src="…">` tag. Nothing else needs editing here.

If the plugin **does not auto-register** with Chart.js, also add a line
inside the template's IIFE:

```ts
// In the template IIFE (same file)
if (window.ChartMyNew) {
  Chart.register(ChartMyNew);
}
```

Most community plugins auto-register. Only add this line if your plugin
docs explicitly say `Chart.register(…)` is required.

### 2. Add an LLM doc snippet

Create `src/llm-docs/plugin-mynew.ts` (or `chart-mynew.ts` for a chart
type):

```ts
export const doc = `
## My New Plugin (chartjs-chart-mynew)

Enables \`chart.type: "mynew"\`. Use for <what it visualizes>.

### Options

| Option                  | Type   | Default | Description                |
| ----------------------- | ------ | ------- | -------------------------- |
| \`options.plugins.mynew.foo\` | string | \`"bar"\` | ...                   |

### Example

\`\`\`json
{
  "type": "mynew",
  "data": { ... }
}
\`\`\`
`
```

Then register it in `src/llm-docs/index.ts`:

```ts
import { doc as chartMyNew } from './chart-mynew'

const docs = [
  // ...existing...
  chartMyNew,
]
```

See [Adding LLM docs](./adding-llm-doc) for the full template and
formatting conventions.

### 3. Add an example

In `src/examples.ts`, append a new entry to `EXAMPLES`:

```ts
{
  title: 'My New Chart',
  config: {
    type: 'mynew',
    data: {
      // ...realistic sample data...
    },
    options: {
      plugins: {
        title: { display: true, text: 'My New Chart example' }
      }
    }
  },
  width: 800,
  height: 600,
},
```

The new entry shows up automatically in:

- `chartjs2img examples -o ./out` output directory
- `GET /examples` gallery page

## Verify

```bash
# 1. Type check
bun run typecheck

# 2. Render the new example alone
bun run cli -- render < <(jq '.[-1].config' <(cat src/examples.ts | ...)) -o /tmp/new.png
# Or simpler: run the examples CLI and look at the last file
bun run cli -- examples -o /tmp/out
ls /tmp/out | tail

# 3. Make sure chartjs2img llm shows your new section
bun run cli -- llm | grep -A 5 "My New Plugin"

# 4. Run the HTTP server and render via curl
bun run dev &
curl -X POST http://localhost:3000/render \
  -H 'Content-Type: application/json' \
  -d '{"chart":{"type":"mynew","data":{...}}}' \
  -o /tmp/mynew.png
open /tmp/mynew.png
```

If the render comes back blank or with `X-Chart-Messages: [{"level":"error",…}]`,
the plugin probably isn't registering. Check:

1. Is `Chart.register(…)` needed for this plugin?
2. Is the UMD global name right (the `window.ChartMyNew` in step 1)?
3. Does the plugin expect peer deps that aren't in `LIBS`?

## Bump the version

If this is a new feature (new chart type, new plugin), bump the minor
version in `package.json`. Keep the patch version for bug-only changes
and maintenance.

The `version.ts` re-export propagates automatically to
`chartjs2img --version`, the `X-Powered-By` header, and the `/health`
payload.

## Don't forget docs

- [Bundled plugins](../guide/plugins) user-facing table — add the new row.
- `README.md` plugin tables.

These are currently hand-maintained. See PLAN.md Phase 2-B for the
future plan to generate the llms-full bundle automatically from
`src/llm-docs/`.
