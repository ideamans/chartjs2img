# Changelog

## 0.7.2 — 2026-11-10

### Fixed

- **The npm package now works under plain Node (22.12+), not only Bun.**
  0.6.0 – 0.7.1 failed on `import 'chartjs2img'` with `ERR_MODULE_NOT_FOUND`:
  `dist/` was emitted with extension-less relative imports (`./renderer`),
  which only Bun resolves. The sources now import siblings as `./x.ts` and
  tsc rewrites them to `./x.js` (`module: nodenext` +
  `rewriteRelativeImportExtensions`); `package.json` is imported with
  `with { type: 'json' }`.
- **The `chartjs2img` bin of the npm package works.** It pointed at
  `src/index.ts` (not in the tarball, and Bun-only). It now points at
  `dist/index.js` (`#!/usr/bin/env node`), and the CLI, the HTTP server
  (`node:http` under Node, `Bun.serve` under Bun) and the Chrome-for-Testing
  download no longer use `Bun.*` APIs.
- **`forceDirectedGraph` renders deterministically on the skia engine.** The
  layout used to be captured once the timer-driven simulation "looked stable",
  so the image depended on timer scheduling (different run to run under Node,
  and often captured before the layout had converged). The skia engine now
  runs the full simulation synchronously (`simulation.initialIterations: 300`,
  `autoRestart: false`; override via `options.simulation`). The built-in
  example's image changes accordingly (more spread out, no crossing edges).

### Added

- `bun run test:pack` (`scripts/test-pack.sh`) and a CI job that packs the
  tarball, installs it into an empty project and, under Node 22.12 / 24 / 26,
  imports the library, runs the CLI and the server, and checks every built-in
  example is pixel-identical to Bun's render.
