---
paths:
  - "src/llm-docs/**/*.ts"
  - "src/examples.ts"
  - "src/template.ts"
  - "src/index.ts"
  - "src/server.ts"
  - "src/renderer.ts"
  - "src/cache.ts"
  - "docs/en/**/*.md"
  - "plugins/chartjs2img/**"
  - "package.json"
  - "context7.json"
---

# Regen triggers

You are editing a file that feeds the AI-artifact generators. When
this turn produces a change in any of the paths above:

1. **Regenerate before committing**: run the `regen-ai` skill
   (`/regen-ai`) or `bun run ai:regen` directly. This refreshes:
   - `docs/public/llms.txt`
   - `docs/public/llms-full.txt`
2. **Validate the Agent Skills bundle** (runs inside `/regen-ai`, or
   directly via `bun run validate-plugin-skills`). The validator catches
   SKILL.md frontmatter drift, plugin.json version mismatch, and
   discovery-keyword regressions.
3. **If you touched `src/examples.ts` or `src/template.ts`**, also
   rerun `bun run docs:examples` so `docs/public/examples/*.png` are
   up to date.
4. **Run typecheck + docs build** (`bun run typecheck && bun run docs:build`)
   after the regen. Surface any newly-failing checks to the user before
   moving on.
5. **Do not hand-edit generated files** to silence a test failure — fix
   the source and regenerate instead. See `.claude/rules/ai-artifacts-policy.md`.

On tag pushes (release), `bun run ai:regen` is mandatory via CI;
`docs:build` runs `build-llms-txt` automatically, but the rendered
example PNGs are produced by `docs:examples` (which needs Chromium)
and so must run before the site build.
