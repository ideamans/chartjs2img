---
title: Environment variables
description: Every chartjs2img environment variable - port, host, auth, concurrency, cache settings, page timeout.
---

# Environment variables

All runtime settings can be configured by env var — convenient for
Docker, Kubernetes, CI, and systemd.

| Variable                 | Default     | Description                                          |
| ------------------------ | ----------- | ---------------------------------------------------- |
| `PORT`                   | `3000`      | HTTP server port                                     |
| `HOST`                   | `0.0.0.0`   | HTTP server bind address                             |
| `API_KEY`                | *(none)*    | Enable auth with this token. See [Authentication](./auth). |
| `CONCURRENCY`            | `8`         | Max simultaneous renders. Additional requests queue. |
| `CACHE_MAX_ENTRIES`      | `1000`      | Max cached images in memory (LRU)                    |
| `CACHE_TTL_SECONDS`      | `3600`      | Cache entry lifetime                                 |
| `PAGE_TIMEOUT_SECONDS`   | `60`        | Orphaned-tab reaper. Renders longer than this are force-killed. |
| `CHROMIUM_PATH`          | *(none)*    | Explicit path to a Chromium binary. First wins over the detection chain. See [Install](./install). |

## Setting them

### Shell

```bash
export PORT=8080
export CONCURRENCY=4
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
      PAGE_TIMEOUT_SECONDS: 30
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

Match to available CPU cores. Each active render uses one browser tab
and some memory (~50-150 MB). Too high and you'll see OOMs or page
timeouts; too low and clients wait in the queue.

Typical values:

- 2 cores → `CONCURRENCY=2`
- 8 cores → `CONCURRENCY=6` (leave headroom for I/O + OS)
- 32 cores → `CONCURRENCY=16` (memory becomes the bottleneck, not CPU)

Watch `GET /health` → `renderer.concurrency.pending` to decide.

### `CACHE_MAX_ENTRIES` / `CACHE_TTL_SECONDS`

Identical requests are cheap; wide-variety requests don't benefit.
Profile with `X-Cache-Hit: true/false`:

- Dashboard with ~50 charts shown many times a day → large cache, long TTL.
- Ad-hoc ad-hoc one-offs → small cache, short TTL.
- Stateless horizontal scale-out → bypass the cache (`CACHE_MAX_ENTRIES=0`) and rely on CDN.

### `PAGE_TIMEOUT_SECONDS`

Covers the case where Chart.js hangs (infinite `animation` recursion,
external plugin stuck loading). Raise only if you have legitimately
slow charts.
