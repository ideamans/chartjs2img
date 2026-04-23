---
title: llms.txt
description: The two public discovery files at the chartjs2img docs root - llms.txt (index) and llms-full.txt (full bundle) - and how agents use them.
---

# llms.txt

chartjs2img publishes two public discovery files at the docs site
root, following the [llmstxt.org](https://llmstxt.org/) convention.
They are designed for LLM agents that land on the site without any
prior chartjs2img knowledge.

| URL                                                                             | Size       | What it is                                                  |
| ------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------- |
| [`/llms.txt`](https://chartjs2img.ideamans.com/llms.txt)                        | ~3 KB      | Index: grouped links to every English docs page             |
| [`/llms-full.txt`](https://chartjs2img.ideamans.com/llms-full.txt)              | ~135 KB    | Full bundle: concatenated Markdown of every page + `chartjs2img llm` reference |

## When to use which

### `llms.txt` — index

Use when the agent wants to **browse**. It's a short Markdown
document with:

- An H1 project title
- A blockquote summary
- `## User Guide`, `## Developer Guide`, `## AI Guide`, `## Gallery`
  sections, each listing pages as bullet links
- A final `## LLM reference (single bundle)` pointer to `llms-full.txt`

Example usage from a shell:

```bash
curl -s https://chartjs2img.ideamans.com/llms.txt | head -20
```

### `llms-full.txt` — full bundle

Use when the agent wants **everything in one payload**. It contains
the Markdown body of every English page, preceded by
`<!-- source: ... -->` comments that name the origin file, separated
by `---` horizontal rules. At the end, `chartjs2img llm`'s full
~1400-line Chart.js + plugin reference is appended.

This is "give my agent the whole manual and let it search in-context."
Appropriate for:

- One-shot agents without retrieval tools (copy the whole thing into
  the system prompt)
- Extended context windows (Claude, Gemini, GPT-4o with their long
  context modes)
- Offline inspection / audit

```bash
curl -s https://chartjs2img.ideamans.com/llms-full.txt | wc -l
```

## How the files are generated

`docs/public/llms.txt` and `docs/public/llms-full.txt` are **not
checked in**. They are regenerated at site-build time by
`scripts/build-llms-txt.ts`:

1. Walk `docs/en/**/*.md`, extract title + body.
2. Sort pages by route.
3. `llms.txt` → group pages by top-level section, emit link list.
4. `llms-full.txt` → concatenate every body, append `getLlmDocs()`
   (the aggregated Chart.js + plugin reference).
5. Write both under `docs/public/` — VitePress serves them from the
   site root.

Trigger manually:

```bash
bun run build-llms-txt
# output:
#   wrote <N> chars → docs/public/llms.txt
#   wrote <N> chars → docs/public/llms-full.txt (<N> docs concatenated)
```

The same script runs inside `docs:dev` / `docs:build` / `ai:regen`.

## Relationship to other AI channels

| Channel                | Audience                                 | Distribution                               |
| ---------------------- | ---------------------------------------- | ------------------------------------------ |
| **llms.txt**           | Any agent that can `curl`                | Static file on the docs site               |
| **llms-full.txt**      | Same, when full-text is cheaper than search | Static file on the docs site            |
| [**context7**](./context7)   | MCP-capable hosts                        | MCP server                                 |
| [**Claude plugin**](./claude-plugin) | Claude Code                    | Marketplace                                |
| [**gh skill**](./gh-skill)   | Copilot / Cursor / Gemini / Codex        | GitHub CLI                                 |
| [**`chartjs2img llm`**](./cli)| An agent running chartjs2img itself      | CLI output (`chartjs2img llm`)             |

llms.txt is the simplest, no-install channel. Even a zero-config
shell script can fetch and use it.

## What agents should do with `llms-full.txt`

A useful opening turn for an agent session:

```
SYSTEM: You are going to author Chart.js configuration JSON for
        chartjs2img. The complete reference follows. It covers the
        input format, every supported chart type, every bundled
        plugin's options, error feedback, and canonical examples.

        ---
        <paste full contents of https://chartjs2img.ideamans.com/llms-full.txt>
        ---

        When you produce a Chart.js configuration:
        1. Validate it via a subsequent `chartjs2img render` call.
        2. If X-Chart-Messages (HTTP) or stderr (CLI) is non-empty,
           fix the config and retry.
        3. Report the final JSON plus the rendered image path.
```

## URL convention

Both files are served at fixed paths, guaranteed stable:

- `https://chartjs2img.ideamans.com/llms.txt`
- `https://chartjs2img.ideamans.com/llms-full.txt`

No redirects, no auth, no user-agent sniffing. They are intended to be
`curl`-able from any environment.

## See also

- [llmstxt.org](https://llmstxt.org/) — the public standard.
- [Anthropic's llms.txt](https://code.claude.com/docs/llms.txt), [Vercel's](https://vercel.com/llms.txt), [Next.js's](https://nextjs.org/docs/llms-full.txt) — real-world reference implementations.
- [context7](./context7) — parallel MCP retrieval for agents that prefer search over full-bundle.
- [CLI reference](./cli) — how `chartjs2img llm` produces the reference that `llms-full.txt` appends.
