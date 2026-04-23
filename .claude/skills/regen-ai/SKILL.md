---
name: regen-ai
description: Regenerate the AI-facing derived artifacts of chartjs2img (docs/public/llms.txt, docs/public/llms-full.txt) from the SSOT in src/llm-docs/ and docs/en/. Use after editing the Chart.js / plugin LLM docs, the built-in examples, the HTML template, the CLI usage banner, or any English guide page - or before merging a branch that touches any of those.
allowed-tools: Bash(bun run *) Bash(bun scripts/*) Bash(git diff*) Bash(git status*) Read Grep
license: MIT
---

# regen-ai

Regenerate every AI-facing derived artifact in dependency order,
verify the result, and report what changed.

## Steps

1. **Check git status** so the user knows what was pending before the regen.
   ```bash
   git status --short
   ```
2. **Regenerate** the LLM text bundle:
   ```bash
   bun run ai:regen
   ```
   Invokes `scripts/build-llms-txt.ts`, which walks `docs/en/**/*.md` and
   aggregates `src/llm-docs/` via `getLlmDocs()`. Outputs:
   - `docs/public/llms.txt` (llmstxt.org index format)
   - `docs/public/llms-full.txt` (full concatenation)

3. **If the user touched `src/examples.ts` or `src/template.ts`**, also
   regenerate the example PNGs (requires Chromium):
   ```bash
   bun run docs:examples
   ```
   Outputs `docs/public/examples/NN-<slug>.{png,json}` for all 18 examples.

4. **Verify** the code still compiles and docs still build:
   ```bash
   bun run typecheck && bun run docs:build
   ```

5. **If the user touched `plugins/chartjs2img/**`**, also run:
   ```bash
   bun run validate-plugin-skills
   ```

6. **Summarize** for the user:
   - Which generated files changed (sizes, line counts)
   - typecheck / docs:build outcome
   - Any warnings surfaced

## Notes

- `docs/public/llms*.txt`, `docs/public/examples/**`, and `src/llm-docs/.generated-reference.md` are gitignored — regenerating updates the local working copy but does not dirty `git status` for those paths. The CI and the published docs site always regenerate at build time, so downstream consumers pick up changes automatically.
- If `bun run docs:examples` fails with a Chromium error, chartjs2img's renderer will try to auto-install Chrome for Testing on first use (~250 MB). That's expected on a fresh checkout. On linux-arm64, set `CHROMIUM_PATH` to a system-installed Chromium first — see `docs/en/guide/install.md`.
- Do **not** hand-edit a generated file to paper over a failure. See `.claude/rules/ai-artifacts-policy.md` — fix the source (LLM docs, example config, guide markdown) and rerun `/regen-ai`.
