---
title: Environment variables (HTTP server)
description: Every environment variable the chartjs2img HTTP server reads — port, host, auth, concurrency, cache, and render timeouts.
---

# Environment variables (HTTP server)

All server-side settings can be configured by env var — convenient
for Docker, Kubernetes, CI, and systemd. Variables relevant only to
the CLI (`CHROMIUM_PATH` when Chromium is auto-installed, for
example) are duplicated here because the server also reads them; see
[CLI → Environment variables](../cli/env-vars) for their CLI-specific
nuances.

| Variable                   | Default     | Description                                                                               |
| -------------------------- | ----------- | ----------------------------------------------------------------------------------------- |
| `PORT`                     | `3000`      | HTTP server port                                                                          |
| `HOST`                     | `0.0.0.0`   | HTTP server bind address                                                                  |
| `API_KEY`                  | *(none)*    | Enable auth with this token. See [Authentication](./auth).                                |
| `CONCURRENCY`              | `8`         | Max simultaneous renders. Additional requests queue.                                      |
| `CACHE_MAX_ENTRIES`        | `1000`      | Max cached images in memory.                                                              |
| `CACHE_TTL_SECONDS`        | `3600`      | Cache entry lifetime.                                                                     |
| `MAX_RENDER_TIME_SECONDS`  | `30`        | Upper bound for a single render (applied to `page.goto` and `waitForFunction`).           |
| `PAGE_TIMEOUT_SECONDS`     | *(derived)* | Override the safety-net force-close timer. Default: `MAX_RENDER_TIME_SECONDS * 2 + 10s`.  |
| `CHROMIUM_PATH`            | *(none)*    | Explicit path to a Chromium binary. Wins over the detection chain. See [Install](../install). |

## Setting them

### Shell

```bash
export PORT=8080
export CONCURRENCY=4
export API_KEY=s3cret
chartjs2img serve
```

### Docker

```bash
docker run -p 8080:8080 \
  -e PORT=8080 \
  -e API_KEY=s3cret \
  -e CONCURRENCY=4 \
  chartjs2img
```

### docker-compose

```yaml
services:
  chartjs2img:
    build: .
    ports:
      - "3000:3000"
    environment:
      API_KEY: s3cret
      CONCURRENCY: 8
      CACHE_MAX_ENTRIES: 2000
      CACHE_TTL_SECONDS: 7200
      MAX_RENDER_TIME_SECONDS: 45
```

### systemd

```ini
[Service]
Environment=PORT=3000
Environment=API_KEY=s3cret
Environment=CONCURRENCY=8
ExecStart=/usr/local/bin/chartjs2img serve
```

## Tuning guidelines

### `CONCURRENCY`

Match it to available CPU cores. Each active render uses one browser
tab and 50-150 MB of memory. Too high and you'll see OOMs or page
timeouts; too low and clients wait in the queue.

Typical values:

- 2 cores → `CONCURRENCY=2`
- 8 cores → `CONCURRENCY=6` (leave headroom for I/O + OS)
- 32 cores → `CONCURRENCY=16` (memory becomes the bottleneck, not CPU)

Watch `GET /health` → `renderer.concurrency.pending` to decide whether
to raise the ceiling or scale out horizontally.

### `CACHE_MAX_ENTRIES` / `CACHE_TTL_SECONDS`

Identical requests are cheap; wide-variety requests don't benefit.
Profile with `X-Cache-Hit: true/false`:

- Dashboard with ~50 charts shown many times a day → large cache, long TTL.
- Ad-hoc one-offs → small cache, short TTL.
- Stateless horizontal scale-out → set `CACHE_MAX_ENTRIES=0` and
  cache at the CDN instead (see [Cache](./cache)).

### `MAX_RENDER_TIME_SECONDS`

Raise only when you have legitimately slow renders (huge datasets,
slow CDN on a cold start). Lower to fail-fast on stuck charts.

### `PAGE_TIMEOUT_SECONDS`

The safety-net timer only fires when the render finally block never
runs (genuinely orphaned tab). You should rarely need to override the
derived default; if you see `Safety net fired after Xms` warnings in
the server logs without the request actually hanging, it indicates a
bug in the renderer — please file an issue.

## See also

- [CLI → Environment variables](../cli/env-vars) — overlapping
  variables read by one-shot `render` calls.
- [Authentication](./auth) — `API_KEY` usage.
- [Cache](./cache) — how `CACHE_MAX_ENTRIES` and `CACHE_TTL_SECONDS`
  interact.
