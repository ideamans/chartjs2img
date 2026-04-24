---
title: gh skill (Copilot / Cursor / Gemini CLI / Codex)
description: Install the chartjs2img skills into any Agent Skills-compatible host using gh skill install - GitHub Copilot, Cursor, Gemini CLI, or OpenAI Codex.
---

# `gh skill` (multi-host)

The same `SKILL.md` files that the Claude Code plugin ships are
Agent Skills standard. `gh skill` (GitHub CLI v2.90+) can install
them into any host that honors the spec.

## Who should read this

Pick `gh skill` over the Claude plugin tutorial if:

- You use **GitHub Copilot**, **Cursor**, **Gemini CLI**, or **OpenAI Codex** (with or without Claude Code alongside).
- You want to pin to a specific git tree SHA so updates are explicit.
- You prefer the `gh` workflow to the Claude marketplace flow.

## Prerequisites

- GitHub CLI **v2.90.0 or later** (`gh --version`).
- The host you're targeting installed and working (Copilot / Cursor / Gemini / Codex / Claude Code).

Verify:

```bash
gh --version         # must be ≥ 2.90.0
gh skill --help      # the skill subcommand should list install / update / preview / search / publish
```

## Install the three skills

Each skill is installed independently so you can choose which ones
you want. Typical full set:

```bash
gh skill install ideamans/chartjs2img plugins/chartjs2img/skills/chartjs2img-render   --agent claude-code
gh skill install ideamans/chartjs2img plugins/chartjs2img/skills/chartjs2img-author   --agent claude-code
gh skill install ideamans/chartjs2img plugins/chartjs2img/skills/chartjs2img-install  --agent claude-code
```

`--agent` can be any of `claude-code`, `copilot`, `cursor`, `gemini`,
`codex`. Run the same command multiple times with different `--agent`
values to install the skill into multiple hosts.

Check what's installed:

```bash
gh skill list
```

## Skill bundle overview

Same three skills as the Claude Code plugin, so content doesn't drift:

| Skill                     | Use when…                                                          |
| ------------------------- | ------------------------------------------------------------------ |
| `chartjs2img-install`     | You need to install / update the `chartjs2img` CLI binary.         |
| `chartjs2img-author`      | You have a description but no JSON config yet. The Chart.js JSON shape and a 14-entry plugin catalog are inlined. |
| `chartjs2img-render`      | You have a JSON config and want a PNG / JPEG / WebP back.          |

Need deeper option tables for a specific plugin? `chartjs2img llm`
(the CLI subcommand) prints the full ~1400-line reference — pipe all
of it or one `## <plugin>` section into the agent as needed.

Each has standards-compliant frontmatter (`name`, `description`,
`license`, `compatibility`, `allowed-tools`) only — see the
[Agent Skills spec](https://agentskills.io/specification). No
Claude-only fields are used, so a skill installed to Copilot behaves
the same as one installed to Claude Code.

## Provenance via frontmatter

`gh skill install` writes three fields into the SKILL.md copy it places
in your host's skill directory:

- `repository: ideamans/chartjs2img`
- `ref: main` (or the specific ref you pinned)
- a tree SHA of `plugins/chartjs2img/skills/<name>` at install time

That tree SHA is how `gh skill update` detects changes — you don't need
a version bump on our side. Any change to the skill body flows through
on `gh skill update`.

## Updating

```bash
gh skill update            # updates all installed skills
gh skill update chartjs2img-render    # one by name
```

## Pinning to a specific version

By default `gh skill install` pins to the current `main` tree SHA. If
you want a specific release:

```bash
gh skill install ideamans/chartjs2img plugins/chartjs2img/skills/chartjs2img-render \
  --ref v0.2.2 \
  --agent claude-code
```

Replace `v0.2.2` with the chartjs2img tag you want. `gh skill update`
won't move you off a pinned ref unless you explicitly unpin.

## What you can't do with `gh skill`

- `gh skill` doesn't install the `chartjs2img` CLI binary itself. Run
  `/chartjs2img-install` from your host after installation, or use one
  of the install paths in the main [Install guide](/en/guide/install).
- `gh skill` doesn't orchestrate skills across hosts. If you want the
  same skill in multiple agents, run `gh skill install` once per
  `--agent`.

## Verifying the install

In your agent host, invoke any of the three skills — e.g.
`/chartjs2img-render`. It should return the skill body without a
"skill not found" error.

If a skill isn't found, check `gh skill list` then look at the host-
specific skill directory (Claude Code: `~/.claude/skills/`; others
documented by the host).

## See also

- [Claude Code plugin](./claude-plugin) — alternative install path.
- [CLI reference](./cli) — what `chartjs2img llm` returns.
- [Agent Skills spec](https://agentskills.io/specification) — the open standard the skills implement.
