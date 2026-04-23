---
title: context7 (MCP retrieval)
description: Register chartjs2img with context7 so any MCP-capable agent can retrieve the Chart.js + plugin reference without installing anything chartjs2img-specific.
---

# context7 (MCP retrieval)

[context7](https://context7.com/) is an Upstash MCP service that
crawls a repo's documentation and serves it to any agent that speaks
[MCP](https://modelcontextprotocol.io/). Register chartjs2img once;
every MCP-capable agent (Claude Code, Cursor, Gemini CLI, Codex,
anything using the spec) can resolve + query the docs without
installing anything else.

This is a **read-only** path — context7 doesn't give agents the
ability to render charts. For that, combine it with the
[Claude plugin](./claude-plugin) or [`gh skill`](./gh-skill) tutorial.

## What context7 does for chartjs2img

When an agent asks "how do I show data labels on a bar chart in
chartjs2img?", context7:

1. Resolves `chartjs2img` to our registered library ID.
2. Searches our docs for the relevant passage (datalabels section +
   the bar example + `plugins/datalabels.display: true` requirement).
3. Returns it to the agent as MCP tool output.

No CLI install, no skill install, no binary download. Pure docs
retrieval.

## How it's set up

A `context7.json` file at the repo root tells context7 what to index:

```json
{
  "$schema": "https://context7.com/schema/context7.json",
  "projectTitle": "chartjs2img",
  "description": "Server-side Chart.js rendering service...",
  "folders": ["docs/en", "examples", "src/llm-docs"],
  "excludeFolders": ["docs/.vitepress", "docs/public", "docs/ja", "node_modules", "dist", "tests"],
  "rules": ["Input is always Chart.js configuration JSON. ...", "..."]
}
```

The `rules` array contains 9 chartjs2img-specific pitfalls — JSON
input shape, no-functions constraint, animation forced off, datalabels
off-by-default, X-Chart-Messages feedback, exit codes, Chromium
availability. Agents always see these, regardless of which specific
doc passage they retrieve.

The live file: [github.com/ideamans/chartjs2img/blob/main/context7.json](https://github.com/ideamans/chartjs2img/blob/main/context7.json).

## How to use it from an MCP-capable agent

### Claude Code

In a session, two MCP tools become relevant:

- `mcp__context7__resolve-library-id` — input: `"chartjs2img"` or a
  vague phrase; output: the canonical library id.
- `mcp__context7__query-docs` — input: library id + a natural-language
  question; output: the retrieved passages.

Example flow the agent runs automatically:

```
user: "Draw a pie chart with data labels."
assistant calls mcp__context7__resolve-library-id("chartjs2img")
      → returns "/ideamans/chartjs2img"
assistant calls mcp__context7__query-docs(
      libraryId="/ideamans/chartjs2img",
      query="pie chart with data labels")
      → returns the pie example + the datalabels section
assistant drafts a JSON config and (if the plugin is installed)
          calls /chartjs2img-render to produce the PNG.
```

### Other MCP hosts

Any agent host that speaks MCP can add context7 as a server:

```bash
# In your MCP host's config
servers:
  context7:
    url: https://mcp.context7.com/
```

Check the host's docs for the exact configuration path (each host
stores MCP server configs differently).

## When context7 is helpful vs not

- **Helpful** when you need answers to "what does option X do" / "what
  plugin handles feature Y" / "what's the shape of data for chart
  type Z". One-shot retrieval, no install.
- **Not helpful** for actually rendering — that requires the CLI
  binary. Use [Claude plugin](./claude-plugin) or
  [`gh skill`](./gh-skill) for the render-loop.
- **Complementary**: context7 + the author/render skills is the best
  combo. context7 surfaces the right option shape; the render skill
  validates it produces a clean PNG.

## Checking that the registration succeeds

After we push `context7.json`, context7 crawls on its own schedule
(typically a few hours). From the context7 web UI
([context7.com/add-package](https://context7.com/add-package)) you
can request an expedited crawl.

Once indexed, test from Claude Code:

```
mcp__context7__resolve-library-id  → ask for "chartjs2img"
```

Should return something like `/ideamans/chartjs2img`. If it returns
empty, the crawl hasn't completed yet; check back in an hour or two.

## What we exclude from the index

- `docs/ja/**` — Japanese is a mirror of English, and duplicated
  content hurts retrieval quality. English is treated as canonical.
- `docs/.vitepress/**` — build config, not content.
- `docs/public/**` — generated artifacts (llms.txt, example PNGs).
- `node_modules/`, `dist/`, `tests/` — not docs.

If you need Japanese retrieval, file an issue — we can add a second
context7 registration for the JA docs.

## See also

- [llms.txt](./llms-txt) — a parallel, simpler discovery file at the site root.
- [CLI reference](./cli) — `chartjs2img llm` produces the same reference offline.
- [context7 docs](https://context7.com/docs/adding-libraries) — how to register your own projects.
