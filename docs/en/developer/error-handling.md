---
title: Error handling
description: How chartjs2img distinguishes server errors, Chart.js rendering errors, and data errors - and how each surfaces to callers.
---

# Error handling

chartjs2img deals with three kinds of failure. Knowing which is which
— and how each surfaces — saves a lot of debugging time.

## 1. Server errors (4xx / 5xx HTTP, non-zero CLI exit)

These are **the request itself is broken**. Examples:

| Scenario                             | HTTP status | CLI exit |
| ------------------------------------ | ----------- | -------- |
| Missing API key when one is required | `401`       | *(not applicable — CLI has no auth)* |
| `POST /render` without `chart`       | `500`       | 1        |
| GET `/render` without `chart=` param | `400`       | *(not applicable)* |
| Chromium can't launch (missing binary)| `500`      | 1        |
| Chromium crashed mid-render          | `500`       | 1        |

Handled in `server.ts::handleRequest` (try/catch around the render) and
`cli.ts::cliRender` (exits on `JSON.parse` failure; lets renderer throw
propagate).

## 2. Chart.js rendering errors (image still returned)

These are **the config itself is weird** but the browser didn't crash.
Examples: typo in `chart.type`, missing dataset field, scale config
that Chart.js can't parse.

chartjs2img's contract here:

- **The render still completes.** The image is returned — it may be blank or partial.
- **Exit code is `0`** (CLI) / HTTP status is `200`.
- **Messages surface** via:
  - HTTP → `X-Chart-Messages: [{"level":"error","message":"…"}, …]` header
  - CLI → `[chart ERROR] <message>` / `[chart WARN] <message>` on stderr

This is on purpose: LLM agents can introspect messages, fix the config,
and retry without having to guess why an image is empty. See the user-
facing [Error feedback](../guide/error-feedback) page for the caller
experience.

### How messages are captured

`renderer.ts` wires two channels:

```ts
page.on('console', msg => { /* capture error/warning console calls */ })
page.on('pageerror', err => { /* capture uncaught exceptions */ })
```

Inside the browser (`template.ts`), an IIFE wraps `console.warn` /
`console.error` to also push into `window.__chartMessages`, and the
`try { new Chart(…) }` catches a thrown construction error into
`window.__chartError`. After `waitForFunction('window.__chartRendered === true')`
the Node side reads both and merges (deduping).

Why the belt + suspenders? Some Chart.js errors fire before the Node-
side `console` listener attaches; the in-browser interception catches
those. Conversely, some Chromium-level messages (resource load
failures, CORS) only show up in the Node-side listener.

## 3. System errors (Chromium won't launch, disk full, OOM)

Bubble out as exceptions. HTTP server returns `500` with the message in
the JSON body; CLI exits non-zero with the message on stderr. There's
no attempt to retry — systemd or your orchestrator should restart the
service if Chromium dies repeatedly.

## Related Chart.js behavior

Chart.js has a policy we deliberately mirror: **a bad option value is
usually a warning, not an exception.** It will do its best to render
and log to the console. Our pipeline preserves that — if you want
"error the request on any warning," handle it in your client:

```ts
const resp = await fetch('/render', { method: 'POST', body: ... })
const xChartMessages = resp.headers.get('X-Chart-Messages')
if (xChartMessages) {
  const messages = JSON.parse(xChartMessages)
  if (messages.some(m => m.level === 'error')) {
    throw new Error('Chart errored: ' + messages[0].message)
  }
}
```

## DataError vs System error — borrowing from lightfile6-jpeg

The `lightfile6-jpeg` package (sibling project) makes a distinction
between **DataError** (the input data is bad — not a system fault) and
system errors (disk, memory). chartjs2img effectively does the same,
but implicitly: Chart.js reporting a console error is the data error;
an exception in our own code is the system error.

If chartjs2img ever grows a TypeScript SDK of its own, the boundary
will likely be:

- Throw `SystemError` when the renderer can't start / crashed / timed out.
- Return `RenderResult { messages: [...] }` when the render completed but
  Chart.js reported something.

Today, "messages" on the result IS the data-error channel. Don't throw
for a bad chart config.

## Logging policy

- `console.log` — only for startup banner and informational progress (one-time events).
- `console.warn` — unusual but expected (forced page close after timeout).
- `console.error` — unexpected failures (browser disconnect, render exception).

We do not log per-request success — that's the caller's job. Runtime
logging of tens of thousands of renders would be noise.

## Timeouts

| Timer                         | Value                         | What happens                                         |
| ----------------------------- | ----------------------------- | ---------------------------------------------------- |
| `page.goto` + `waitForFunction` | 30 seconds (hardcoded)       | Throws; request returns `500` / CLI exits non-zero.  |
| `PAGE_TIMEOUT_SECONDS`        | default `60`, env-configurable | Force-closes the tab. If the render was mid-flight, the caller sees a 500/exception too. |
| Browser launch                | puppeteer default ~30 seconds | Same as above.                                       |

There's **no overall request timeout** on the HTTP server — clients
can (and should) set their own client-side timeout.
