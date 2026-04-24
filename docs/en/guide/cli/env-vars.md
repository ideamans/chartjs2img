---
title: Environment variables (CLI)
description: Environment variables relevant to chartjs2img CLI rendering — Chromium discovery, render timeouts, and cache settings for one-shot use.
---

# Environment variables (CLI)

Running `chartjs2img render` reads a small set of environment
variables — mostly to locate Chromium and to tune the render budget.
Variables specific to the HTTP server (`PORT`, `HOST`, `API_KEY`)
have no effect here; see [HTTP server → Environment variables](../http/env-vars)
for those.

| Variable                   | Default     | Description                                                                             |
| -------------------------- | ----------- | --------------------------------------------------------------------------------------- |
| `CHROMIUM_PATH`            | *(none)*    | Explicit path to a Chromium / Chrome executable. Wins over the auto-detection chain.     |
| `PLAYWRIGHT_BROWSERS_PATH` | *(none)*    | Override the Playwright cache directory searched during detection.                       |
| `MAX_RENDER_TIME_SECONDS`  | `30`        | Upper bound for a single render (applied to `page.goto` and `waitForFunction`).          |
| `PAGE_TIMEOUT_SECONDS`     | *(derived)* | Override the safety-net force-close timer. Default: `MAX_RENDER_TIME_SECONDS * 2 + 10s`. |
| `CONCURRENCY`              | `8`         | Not exercised by one-shot `render`, but respected by `chartjs2img examples` batch mode. |

The cache variables (`CACHE_MAX_ENTRIES`, `CACHE_TTL_SECONDS`) are
also read at startup, but the cache lives only as long as the process
— so a single one-shot `render` call cannot benefit from cache hits.
They are effectively a server concern.

## Setting them

### Per-command

```bash
CHROMIUM_PATH=/usr/bin/chromium-browser chartjs2img render -i chart.json -o chart.png
```

### Per-shell

```bash
export CHROMIUM_PATH=/usr/bin/chromium-browser
export MAX_RENDER_TIME_SECONDS=60

chartjs2img render -i chart.json -o chart.png
```

### In CI / systemd

Set them alongside your job definition. On GitHub Actions:

```yaml
- name: Render charts
  env:
    CHROMIUM_PATH: /usr/bin/chromium-browser
    MAX_RENDER_TIME_SECONDS: 60
  run: chartjs2img render -i chart.json -o chart.png
```

## When to tune

### `CHROMIUM_PATH`

Set it when the auto-detection chain can't find a browser you know is
installed — Linux ARM64 is the common case because the Chrome for
Testing auto-download does not publish linux-arm64 builds. See
[Install → Linux ARM64](../install#linux-arm64-manual-chromium-required).

### `MAX_RENDER_TIME_SECONDS`

Raise it when you legitimately need long renders — e.g. a very
large force-directed graph or a CDN cold start on a slow network.
The default 30 s covers every bundled example several times over.

### `PAGE_TIMEOUT_SECONDS`

Leave it alone unless you see a `Safety net fired after Xms` warning
in stderr without the render actually hanging. If that happens the
derived default is too tight — raise it (or increase
`MAX_RENDER_TIME_SECONDS`, which re-derives the safety net).

## See also

- [Install](../install) — Chromium detection order and linux-arm64 notes.
- [Error feedback](./error-feedback) — interpreting render-time
  warnings on stderr.
