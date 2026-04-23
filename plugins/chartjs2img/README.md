# chartjs2img plugin for AI agent hosts

This directory packages chartjs2img as an [Agent Skills](https://agentskills.io/)
plugin. The same skills are consumable by:

- **Claude Code** via the [plugin marketplace](https://code.claude.com/docs/en/plugin-marketplaces) flow
- **GitHub CLI** via `gh skill install …`
- Cursor, Gemini CLI, Codex, and any other host that speaks the Agent Skills open standard

## Layout

```
plugins/chartjs2img/
├── .claude-plugin/
│   └── plugin.json                         # Claude marketplace manifest
├── skills/
│   ├── chartjs2img-render/SKILL.md         # render a Chart.js config to an image
│   ├── chartjs2img-author/SKILL.md         # compose a new config from a description
│   ├── chartjs2img-llm/SKILL.md            # load the full Chart.js + plugin reference
│   └── chartjs2img-install/SKILL.md        # install or update the chartjs2img CLI
├── PUBLISH.md                               # pre-push checklist
└── README.md                                # this file
```

Every `SKILL.md` uses the standard Agent Skills frontmatter fields only
(`name`, `description`, `license`, `compatibility`, `allowed-tools`).
Claude-specific behavior lives under `metadata.claude-code.*` when it's
needed, so the skills remain portable across hosts.

Run the validator before publishing:

```bash
bun run validate-plugin-skills
```

## Installation paths

### Claude Code — via a marketplace

1. Create or reuse a marketplace repository (e.g. `ideamans/claude-public-plugins`) with a `.claude-plugin/marketplace.json` that lists this plugin:

   ```json
   {
     "name": "ideamans-plugins",
     "owner": { "name": "Ideamans Inc.", "email": "support@ideamans.com" },
     "plugins": [
       {
         "name": "chartjs2img",
         "source": {
           "source": "git-subdir",
           "url": "https://github.com/ideamans/chartjs2img.git",
           "path": "plugins/chartjs2img"
         },
         "description": "Adds /chartjs2img-render, /chartjs2img-author, /chartjs2img-llm, and /chartjs2img-install skills.",
         "homepage": "https://github.com/ideamans/chartjs2img",
         "keywords": ["chart", "chartjs", "image", "visualization"]
       }
     ]
   }
   ```

2. Users then install from Claude Code:

   ```
   /plugin marketplace add ideamans/claude-public-plugins
   /plugin install chartjs2img@ideamans-plugins
   ```

### Claude Code — directly from this repo (testing)

From a local checkout:

```
/plugin marketplace add ./plugins/chartjs2img   # single-plugin marketplace
```

(Requires the repo to be registered via `extraKnownMarketplaces` or used with `--scope project`; see the Claude docs.)

### GitHub CLI (`gh skill`)

```bash
gh skill install ideamans/chartjs2img plugins/chartjs2img/skills/chartjs2img-render --agent claude-code
gh skill install ideamans/chartjs2img plugins/chartjs2img/skills/chartjs2img-author
gh skill install ideamans/chartjs2img plugins/chartjs2img/skills/chartjs2img-llm
gh skill install ideamans/chartjs2img plugins/chartjs2img/skills/chartjs2img-install
```

`gh skill install` writes `repository` / `ref` / tree SHA into the
frontmatter on install so `gh skill update` can detect changes. That's
compatible with chartjs2img's SSOT-first policy: a bump in this repo
flows through to everyone.

## Runtime dependency

Three of the four skills rely on the `chartjs2img` CLI being on `PATH`.
The fourth, `chartjs2img-install`, is the one that installs it.

- **Install options**: `chartjs2img-install` skill, or `bun install -g chartjs2img` (once published), or the GitHub Releases binary, or build from source via `bun run build`.
- **Sanity check**: `chartjs2img --version` and `chartjs2img llm | head`.

If `chartjs2img` is missing, each skill prompts the user to run
`/chartjs2img-install` rather than silently failing.

## Maintenance

When chartjs2img's version bumps (`package.json`), bump
`plugins/chartjs2img/.claude-plugin/plugin.json:version` to match.
`bun run validate-plugin-skills` enforces this. Keep the `name` fields
in each `SKILL.md` in sync with the parent directory name — the
validator enforces that too.
