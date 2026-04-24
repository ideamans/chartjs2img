---
title: Error feedback (HTTP)
description: How Chart.js errors and warnings surface over HTTP — X-Chart-Messages header, 4xx validation errors, and 5xx Chromium issues.
---

# Error feedback (HTTP)

Rendering a chart over HTTP can produce three kinds of signal:

1. **The image itself** — always returned, even when something went wrong.
2. **Chart.js console messages** — captured from the headless browser
   and returned via an HTTP header.
3. **Server-level errors** — authentication, input validation, or
   Chromium failures. Returned as standard HTTP status codes.

This page is about all three.

## `X-Chart-Messages` — Chart.js console

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
header means clean render. The render itself still completes and
returns `200` with the PNG — a warning is an advisory, not a failure.

## HTTP status codes

| Status | Meaning                                                                                        |
| ------ | ---------------------------------------------------------------------------------------------- |
| `200`  | Render OK. May still carry `X-Chart-Messages` if Chart.js warned.                              |
| `400`  | Client input invalid: missing `chart`, malformed JSON body, bad `?chart=` query parameter.     |
| `401`  | `API_KEY` required and not provided / wrong. See [Authentication](./auth).                     |
| `404`  | Unknown path, expired/unknown cache hash.                                                      |
| `405`  | Method not allowed on `/render` (e.g. `PUT`).                                                  |
| `500`  | Internal server error — Chromium failed to launch, disk full, network problem with the CDN.   |

The body of 4xx and 5xx responses is a JSON object:

```json
{ "error": "Missing or invalid required field: chart (must be an object)" }
```

400 vs. 500 is deliberate: client input errors are not monitoring
alerts. If you see 5xx in production, treat it as a real incident
(not a user typo).

## When rendering "succeeds but is wrong"

A Chart.js config can be syntactically valid, render, and still be
wrong — e.g. a `scatter` chart given `labels` + `datasets[0].data:
[1,2,3]` instead of `{x,y}` pairs. These often don't throw but emit
warnings. Always scan `X-Chart-Messages` before declaring success.

## Recommended agent workflow

If you're driving chartjs2img from an LLM agent over HTTP:

1. Submit the render.
2. If the response is 4xx/5xx, feed the `error` string back and ask
   the agent to fix the request or the environment.
3. If the response is 200, check `X-Chart-Messages`. If non-empty,
   feed the messages back and ask for a config fix.
4. Loop until messages are empty.

This is effectively how the `/chartjs2img-render` Agent Skill works.
See [AI Guide → Claude Code plugin](/en/ai/claude-plugin).

## Common Chart.js messages

| Message                                         | Usual cause                                                                 |
| ----------------------------------------------- | --------------------------------------------------------------------------- |
| `"X" is not a registered controller.`           | Typo in `chart.type`, or a plugin chart type missing from the bundle.       |
| `Cannot read properties of undefined...`        | Missing `datasets`, wrong dataset shape, or numeric `data` where object expected. |
| `No dataset matched the index`                  | Mismatch between `labels.length` and `data.length`.                         |
| `The scale "y" doesn't have a parser`           | Time-series data without a time adapter — use `scales.x.type: "time"`.      |

When in doubt, the full Chart.js
[error reference](https://www.chartjs.org/docs/latest/) tells you
what each message means.

## Chromium-level failures

If the browser itself fails to launch (missing binary, permissions,
container without shared memory), the server responds `500` with a
message like:

```json
{ "error": "Failed to install Chrome automatically: ..." }
```

and logs the underlying error to stderr. Fix the environment, not
the chart config. See
[Install → Chromium / Chrome detection](../install#chromium--chrome-detection).
