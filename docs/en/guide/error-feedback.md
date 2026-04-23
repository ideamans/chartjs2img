---
title: Error feedback
description: How Chart.js errors and warnings surface through chartjs2img - X-Chart-Messages for HTTP, stderr for CLI, and what to do when messages arrive.
---

# Error feedback

Rendering a chart can produce three kinds of signal:

1. **The image itself** — always returned, even when something went wrong.
2. **Chart.js console messages** — captured from the browser and returned as structured data.
3. **Server-level errors** — authentication, missing Chromium, etc. These are standard HTTP status codes.

This page is about #2: how Chart.js tells you something is off.

## Why this exists

A Chart.js config with a typo (e.g. `"type": "pi"` instead of `"pie"`)
renders a blank or partial image. Without console access you'd be left
guessing why your chart is empty. chartjs2img captures the same
messages you'd see in DevTools and ships them back.

## HTTP — `X-Chart-Messages`

When Chart.js logs errors or warnings during a render, the response
includes:

```
X-Chart-Messages: [{"level":"error","message":"\"pi\" is not a registered controller."}]
```

Parse it as JSON:

```bash
curl -s -D- -X POST http://localhost:3000/render \
  -H 'Content-Type: application/json' \
  -d '{"chart":{"type":"pi","data":{"labels":["A"],"datasets":[{"data":[1]}]}}}' \
  -o /dev/null | grep X-Chart-Messages
```

Each message is:

| Field     | Values              | Description                 |
| --------- | ------------------- | --------------------------- |
| `level`   | `"error"`, `"warn"` | Severity                    |
| `message` | string              | Verbatim text from Chart.js |

The header is **only present** when at least one message occurred. No
header means clean render.

## CLI — stderr

In CLI mode, the same messages go to stderr with a prefix:

```bash
$ echo '{"type":"pi","data":{"labels":["A"],"datasets":[{"data":[1]}]}}' \
  | chartjs2img render -o chart.png

[chart ERROR] "pi" is not a registered controller.
Written to chart.png (hash: ...)
```

The render still completes (writing an empty/partial PNG) and the CLI
still exits `0`. Separate stderr from stdout if you pipe the image
binary:

```bash
chartjs2img render -i input.json 2> errors.log > chart.png
```

## When rendering "succeeds but is wrong"

A Chart.js config can be syntactically valid, render, and still be
wrong — e.g. a `scatter` chart fed `labels` + `datasets[0].data: [1,2,3]`
instead of `{x,y}` pairs. These often don't throw, but you'll see
warnings in the console. Always check for messages before declaring
success.

## Recommended agent workflow

If you're driving chartjs2img from an LLM agent:

1. Submit the render.
2. Check `X-Chart-Messages` (HTTP) or stderr (CLI).
3. If the array is non-empty, feed the messages back into the agent
   and ask it to fix the config.
4. Loop until messages are empty.

This is effectively how the `/chartjs2img-render` Agent Skill works.
See [AI Guide → Claude Code plugin](/en/ai/claude-plugin) for the full
flow.

## Common messages

| Message                                         | Usual cause                                   |
| ----------------------------------------------- | --------------------------------------------- |
| `"X" is not a registered controller.`           | Typo in `chart.type`                          |
| `Cannot read properties of undefined...`        | Missing `datasets` or wrong dataset shape     |
| `No dataset matched the index`                  | Mismatch between `labels.length` and `data.length` |
| `The scale "y" doesn't have a parser`           | Time-series data without `chartjs-adapter-dayjs-4` date adapter |

When in doubt, the full Chart.js [error reference](https://www.chartjs.org/docs/latest/)
tells you what each message means.
