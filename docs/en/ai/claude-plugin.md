---
title: Claude Code plugin
description: Install chartjs2img skills into Claude Code via the plugin marketplace - from clean machine to rendered Chart.js PNG in 10 minutes.
---

# Claude Code plugin

The `chartjs2img` plugin bundles three skills that let Claude Code
install the CLI, author configs from a description, and render to
PNG / JPEG / WebP. The Chart.js JSON shape and a plugin catalog are
inlined into the author skill itself — no separate "load the
reference" step required.

## Prerequisites

- [Claude Code](https://code.claude.com/) installed and working.
- `git` on `PATH` (the marketplace is a git clone).

That's it. The plugin's `/chartjs2img-install` skill handles the CLI
binary + auto-downloads Chromium.

## 1. Add the marketplace

The chartjs2img plugin is distributed via **ideamans/claude-public-plugins**
(an aggregate marketplace for Ideamans' open-source plugins).

In Claude Code:

```
/plugin marketplace add ideamans/claude-public-plugins
```

The first add clones the marketplace; subsequent sessions reuse the
cache. Claude Code will confirm with something like:

```
Added marketplace ideamans-plugins from github.com/ideamans/claude-public-plugins
```

## 2. Install the plugin

```
/plugin install chartjs2img@ideamans-plugins
```

This registers three slash commands:

- `/chartjs2img-install` — install / update the CLI
- `/chartjs2img-author` — compose a config from a description (JSON
  constraints and plugin catalog inlined)
- `/chartjs2img-render` — render a config to PNG / JPEG / WebP

## 3. Install the CLI binary

```
/chartjs2img-install
```

The skill:

1. Detects your OS + arch (linux / darwin / windows × amd64 / arm64).
2. Fetches the matching release asset from github.com/ideamans/chartjs2img/releases.
3. Verifies the SHA-256 checksum.
4. Drops the binary in `~/.local/bin` (or another writable PATH directory).
5. Runs `chartjs2img --version` to confirm.

If no writable PATH directory exists, the skill stages the binary in
`/tmp` and prints the exact `sudo mv` command to complete the install.

Verify:

```
chartjs2img --version
```

Should print `chartjs2img v0.2.2` (or whatever tag is latest).

## 4. Author a chart

```
/chartjs2img-author monthly sales bar chart for Jan-Jun, data 12 19 3 5 2 15
```

The skill picks the chart type (`bar`), fills in a realistic skeleton,
validates with `chartjs2img render`, and iterates on any Chart.js
error messages until the render is clean.

It hands back the PNG path plus the JSON config so you can save, edit,
or feed into your own pipeline.

If the agent needs deeper plugin-option detail than the skill inlines,
it can pipe `chartjs2img llm` (or a single section of it) into the
conversation — see the [CLI reference](./cli#chartjs2img-llm).

## 5. Render an existing config

If you already have a `.json` file:

```
/chartjs2img-render sales.json
```

The skill redirects `chartjs2img render`'s stderr and inspects it for
`[chart ERROR]` / `[chart WARN]` messages. A clean render ends with a
one-line summary (path + size); a messaged render ends with concrete
fix suggestions (misspelled chart type, missing dataset shape, etc.).

## Updating

When a new chartjs2img version ships:

```
/plugin marketplace update
/plugin update chartjs2img@ideamans-plugins
/chartjs2img-install      # upgrades the CLI binary in place
```

The plugin manifest's `version` is pinned to chartjs2img's own version,
so a CLI bump implies a plugin bump.

## Troubleshooting

**`/chartjs2img-* : unknown command`** — the plugin isn't installed.
Run `/plugin list` to confirm; if missing, repeat step 2.

**`chartjs2img: command not found`** — binary not on PATH. Run
`/chartjs2img-install` again, or check whether your shell picked up
`~/.local/bin` (start a new shell or `exec $SHELL`).

**Rendering fails with a Chromium error** — on first render,
chartjs2img downloads Chrome for Testing. If that fails (firewall,
corporate proxy, linux-arm64), fall back to manual install + set
`CHROMIUM_PATH`. See [Install](/en/guide/install).

**Rendered image is blank** — check the skill's output for
`X-Chart-Messages`. A typo in `chart.type` or missing `datasets` is
the usual culprit. The render still succeeded technically (exit 0),
but Chart.js gave up on drawing.

## See also

- [CLI reference](./cli) — the `chartjs2img llm` output format.
- [`gh skill` tutorial](./gh-skill) — the same skills in Copilot / Cursor / Gemini / Codex.
- [Plugin publishing checklist](https://github.com/ideamans/chartjs2img/blob/main/plugins/chartjs2img/PUBLISH.md) — how we keep the plugin in sync with releases.
