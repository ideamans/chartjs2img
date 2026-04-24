---
title: Error feedback (CLI)
description: How Chart.js warnings and errors surface to stderr when using the chartjs2img CLI — diagnosing blank or partial renders.
---

# Error feedback (CLI)

A Chart.js config with a typo (e.g. `"type": "pi"` instead of
`"pie"`) renders a blank or partial image. Without console access
you'd be left guessing why your chart is empty. The CLI captures the
same messages you'd see in the browser's DevTools and streams them to
**stderr** as the render runs.

## The shape

Each message is prefixed with its level and the literal message text
from Chart.js:

```
[chart ERROR] "pi" is not a registered controller.
[chart WARN]  Some warning message from Chart.js.
```

Two levels are emitted:

- `ERROR` — Chart.js threw or refused to render the config.
- `WARN` — Chart.js rendered something but flagged a likely mistake.

## Example

```bash
$ echo '{"type":"pi","data":{"labels":["A"],"datasets":[{"data":[1]}]}}' \
  | chartjs2img render -o chart.png

[chart ERROR] "pi" is not a registered controller.
Written to chart.png (hash: 1234abcd5678efgh)
```

Notice: the render **still completes** (writing an empty or partial
PNG) and the CLI still exits `0`. Chart.js warnings are not treated as
CLI failures, so pipelines don't fail on a typo — you have to watch
stderr and decide yourself.

## Piping the image while capturing messages

Since stdout carries the image binary and stderr carries diagnostics,
you can redirect them independently:

```bash
chartjs2img render -i chart.json 2> errors.log > chart.png
```

Check `errors.log` for messages and `chart.png` for the image.

## When rendering "succeeds but is wrong"

A Chart.js config can be syntactically valid, render, and still be
wrong — e.g. a `scatter` chart given `labels` + `datasets[0].data:
[1,2,3]` instead of `{x,y}` pairs. These often don't throw but emit a
warning. Always scan stderr before declaring success in a CI job.

## Recommended agent workflow

If you're driving `chartjs2img render` from an LLM agent:

1. Run the render, capturing stderr.
2. If stderr is non-empty, feed the messages back into the agent and
   ask it to fix the config.
3. Loop until stderr is clean.

This is effectively how the `chartjs2img-render` Agent Skill works.
See [AI Guide → Claude Code plugin](/en/ai/claude-plugin) for the full
loop.

## Common messages

| Message                                         | Usual cause                                                                 |
| ----------------------------------------------- | --------------------------------------------------------------------------- |
| `"X" is not a registered controller.`           | Typo in `chart.type`, or a plugin chart type missing from the bundle.       |
| `Cannot read properties of undefined...`        | Missing `datasets`, wrong dataset shape, or numeric `data` where object expected. |
| `No dataset matched the index`                  | Mismatch between `labels.length` and `data.length`.                         |
| `The scale "y" doesn't have a parser`           | Time-series data without a time adapter — use `scales.x.type: "time"`.      |

When in doubt, the full Chart.js
[error reference](https://www.chartjs.org/docs/latest/) tells you what
each message means.

## Non-Chart.js errors

Messages about Chromium (download, launch, container permissions)
appear **without** the `[chart …]` prefix and typically exit non-zero.
They signal an environment problem, not a config problem:

```
[renderer] Chrome/Chromium not found. Installing Chrome for Testing...
[renderer] Downloading Chrome 123.0.0.0 for mac-arm64...
```

See [Install → Chromium / Chrome detection](../install#chromium--chrome-detection)
if the auto-install doesn't work for your platform.
