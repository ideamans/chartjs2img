# Publishing checklist — chartjs2img plugin

Use this before pushing changes that affect `plugins/chartjs2img/**`
to the `ideamans/chartjs2img` repository, and before any marketplace
update in `ideamans/claude-public-plugins`.

## Pre-push checklist

- [ ] `plugins/chartjs2img/.claude-plugin/plugin.json` `version` equals root `package.json` `version`. The `validate-plugin-skills` script enforces this locally.
- [ ] `bun run validate-plugin-skills` passes with 0 errors and 0 warnings.
- [ ] `claude plugin validate plugins/chartjs2img` returns ✔ (if the Claude CLI is installed).
- [ ] `bun run typecheck` and `bun run docs:build` are both green.
- [ ] Every SKILL.md description contains the discovery keywords the validator asserts on (e.g. `chartjs2img-render` must mention "render", "Chart.js", "image"; `chartjs2img-author` must mention "compose", "chart", "visualize").
- [ ] README.md (in this directory) cites the correct install flow — the runtime dependency (`chartjs2img` CLI on PATH) is accurate.

## Marketplace update flow

Once `plugins/chartjs2img/**` is pushed to `ideamans/chartjs2img`:

```bash
# In ideamans/claude-public-plugins checkout:
claude plugin validate .           # marketplace.json schema
git pull && git status             # ensure clean
# If you changed plugin metadata (description/version/keywords), update
# the corresponding entry in .claude-plugin/marketplace.json.
git commit -am "chartjs2img: bump to <version>"
git push                           # downstream users pick up via
                                   #   /plugin marketplace update
```

The `git-subdir` source pins to the default branch of
`ideamans/chartjs2img`. To pin to a release tag, add `ref: "v<version>"`
or a `sha` field — see the Claude docs on plugin sources.

## When to bump version

| Change type                                             | Bump         |
| ------------------------------------------------------- | ------------ |
| Skill body text only (instructions, examples)           | patch        |
| New skill / breaking skill removal                      | minor / major |
| `allowed-tools` widened                                 | patch        |
| `plugin.json.keywords` / description tweak              | patch        |
| chartjs2img CLI surface change that skills rely on      | match the CLI's own version |

Keep `plugin.json.version` aligned with `package.json.version`. If the
library is at `0.2.2` and this plugin only had a skill body tweak,
bump **both** to `0.2.3` together so downstream users can trust the
version label to reflect the full product.
