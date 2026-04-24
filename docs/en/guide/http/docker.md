---
title: Docker
description: Build and run the chartjs2img HTTP server in Docker — bundled Chromium, Noto Sans CJK, docker-compose, and reverse-proxy recipes.
---

# Docker

The Docker image is intended for the **HTTP server** workflow: one
container, one long-running server, many clients. If you want to
render a single chart on your laptop, the [CLI](../cli/) is
lighter — no container needed.

## Build

```bash
docker build -t chartjs2img .
```

What the image includes:

- The compiled `chartjs2img` binary (via Bun's `--compile`)
- Chromium (preinstalled, so no first-run download at service start)
- **Noto Sans CJK** — Japanese, Chinese, and Korean labels render correctly

## Run

```bash
docker run -p 3000:3000 chartjs2img
```

With configuration:

```bash
docker run -p 3000:3000 \
  -e API_KEY=s3cret \
  -e CONCURRENCY=4 \
  -e CACHE_MAX_ENTRIES=2000 \
  -e CACHE_TTL_SECONDS=7200 \
  chartjs2img
```

See [Environment variables](./env-vars) for the full list.

## docker-compose

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
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000/health"]
      interval: 30s
      timeout: 5s
      retries: 3
```

## Behind a reverse proxy

For production, front chartjs2img with nginx / Caddy / a CDN for TLS,
rate-limiting, and request logging.

### nginx

```nginx
upstream chartjs2img {
  server 127.0.0.1:3000;
}

server {
  listen 443 ssl;
  server_name charts.example.com;

  location / {
    proxy_pass http://chartjs2img;
    proxy_set_header Host $host;
    # Don't buffer at the proxy — /cache/:hash is already immutable
    proxy_buffering off;
    # Long-tail renders can take several seconds
    proxy_read_timeout 60s;
  }
}
```

### Caddy

```
charts.example.com {
  reverse_proxy localhost:3000 {
    transport http {
      read_timeout 60s
    }
  }
}
```

## Persistence

The hash cache is **in-memory**. Restarting the container clears it —
clients just get `X-Cache-Hit: false` until the cache rewarms.

If you need durable caching across restarts, either:

- Place a CDN in front and cache `/cache/:hash` at the edge
  (best-in-class for immutable content).
- Write your own caching layer that stores the rendered PNG somewhere
  durable and bypasses chartjs2img's internal cache entirely.

## Linux ARM64

The Docker image builds on linux/amd64 by default. For linux/arm64
(Apple Silicon, AWS Graviton), use buildx:

```bash
docker buildx build --platform linux/arm64 -t chartjs2img .
```

The base image uses Debian's packaged Chromium which **does** support
linux-arm64 — unlike the auto-download path. See
[Install → Linux ARM64](../install#linux-arm64-manual-chromium-required)
for native (non-Docker) notes.

## Troubleshooting

### Container starts but renders time out

Check `docker logs <container>` — look for Chromium launch errors.
Common fixes:

- Give the container enough shared memory: `--shm-size=1g`
- Ensure the container user has write access to `/tmp` (Chromium
  scratch space)

### Japanese / CJK text shows up as boxes

This shouldn't happen with the provided Dockerfile (Noto Sans CJK
is baked in). If you customized it, install the fonts explicitly:

```dockerfile
RUN apt-get update && apt-get install -y \
  fonts-noto-cjk fonts-noto-color-emoji \
  && rm -rf /var/lib/apt/lists/*
```

### Image builds but Chromium isn't found at runtime

Set `CHROMIUM_PATH` explicitly:

```bash
docker run -e CHROMIUM_PATH=/usr/bin/chromium chartjs2img
```
