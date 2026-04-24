---
title: AI Guide
description: Tutorials for using chartjs2img with LLM agents - Claude Code plugin, GitHub gh skill, context7 MCP, and llms.txt.
---

# AI Guide

chartjs2img is built to be **driven by an LLM agent**. You describe
what you want in natural language; an agent produces a valid
Chart.js configuration JSON, renders it with chartjs2img, reads back
any Chart.js errors, and iterates — no manual reference-pasting
required.

This guide is **task-oriented**. Pick one of the three usage paths
below and follow it end-to-end. Each tutorial starts from a clean
machine and ends with a rendered PNG plus the command to update
later.

## Three ways to use chartjs2img from an agent

| Tutorial                                  | Best for                                                                       |
| ----------------------------------------- | ------------------------------------------------------------------------------ |
| [Claude Code plugin](./claude-plugin)     | You use Claude Code. Slash commands (`/chartjs2img-install`, `/chartjs2img-author`, `/chartjs2img-render`) drive the whole workflow. |
| [`gh skill`](./gh-skill)                  | You want the same skill bundle installed into Copilot, Cursor, Gemini CLI, or Codex alongside (or instead of) Claude Code. |
| [context7 (MCP)](./context7)              | You want an agent to retrieve chartjs2img's docs via MCP without installing anything plugin-side. Read-only. |

You can mix and match. The Claude plugin includes a `/chartjs2img-install`
skill that fetches the CLI binary; `gh skill` gives you the same
skills in other hosts; context7 is a parallel retrieval channel that
works even without any plugin.

## What you'll need

None of this is installed by chartjs2img itself. Install whatever the
tutorial of your choice calls for before starting.

| Software                                                         | For which tutorial                    | Why                                    |
| ---------------------------------------------------------------- | ------------------------------------- | -------------------------------------- |
| [git](https://git-scm.com/)                                      | All                                   | Plugin marketplaces clone over git.    |
| [Claude Code](https://code.claude.com/)                          | Claude plugin, context7               | Host that runs the skills / MCP.       |
| [GitHub CLI `gh`](https://cli.github.com/) (v2.90+)              | `gh skill`                            | Provides the `gh skill` subcommand.    |
| [Cursor](https://cursor.com/) / [Gemini CLI](https://github.com/google-gemini/gemini-cli) / [Codex](https://openai.com/index/introducing-codex/) | `gh skill` (optional target)          | Alternative skill hosts.               |
| `curl`, `tar`, `unzip` (windows)                                 | `/chartjs2img-install` runtime        | Downloading the chartjs2img binary.   |
| `bun` ([install](https://bun.sh/))                               | Only if building chartjs2img from source | You can use the release binary instead.|

You do **not** need to install the `chartjs2img` CLI manually — the
Claude plugin ships a `/chartjs2img-install` skill that handles it,
and `gh skill` users can run the same skill after installing it. If
you'd rather install chartjs2img outside your agent, follow the
standard [Quick start](/en/guide/) or [Install](/en/guide/install)
page; any install that puts `chartjs2img` on `$PATH` is picked up by
the skills automatically.

Chromium is handled separately by chartjs2img at render time — see
the main install guide if you're on linux-arm64.

## At a glance: what chartjs2img exposes

If you want the full tour before picking a tutorial:

- **[`chartjs2img llm`](./cli#chartjs2img-llm)** — one-shot Markdown
  reference teaching an agent the Chart.js config JSON shape, every
  bundled plugin's options, and the canonical examples. The
  `/chartjs2img-author` skill already inlines the JSON shape and a
  plugin catalog; reach for `chartjs2img llm` when an agent needs the
  full option tables for a specific plugin.
- **[`/llms.txt`](https://chartjs2img.ideamans.com/llms.txt) + [`/llms-full.txt`](https://chartjs2img.ideamans.com/llms-full.txt)** — public discovery files on the docs site.
- **[`context7.json`](https://github.com/ideamans/chartjs2img/blob/main/context7.json)** — registers chartjs2img for [context7](./context7) MCP retrieval.
- **[`plugins/chartjs2img`](https://github.com/ideamans/chartjs2img/tree/main/plugins/chartjs2img)** — three skills (`chartjs2img-install`, `chartjs2img-render`, `chartjs2img-author`) distributed via Claude Code and `gh skill`.

The [CLI reference page](./cli) documents `chartjs2img llm` in full —
useful whether an agent is driving it through a skill or you're
running it manually in a terminal.

## Tutorials

Start here:

- **[Claude Code plugin](./claude-plugin)** — 10-minute path if you
  already use Claude Code.
- **[`gh skill`](./gh-skill)** — if you want the skills in Copilot /
  Cursor / Gemini / Codex.
- **[context7](./context7)** — if you want an agent to *retrieve*
  chartjs2img docs over MCP without installing anything chartjs2img-
  specific.
