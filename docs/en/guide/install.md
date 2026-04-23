---
title: Install
description: Install chartjs2img from source, as a single binary, or via Docker. Includes Chromium detection behavior and Linux ARM64 notes.
---

# Install

chartjs2img ships as a Bun project. You can run it from source, compile
it to a single binary, or pull a Docker image.

## Option A — from source (recommended during development)

```bash
git clone https://github.com/ideamans/chartjs2img
cd chartjs2img
bun install
bun run dev              # starts the HTTP server on :3000
```

Bun runs TypeScript directly, so there's no separate build step for dev.

## Option B — single binary (recommended for distribution)

Compile to a standalone executable:

```bash
bun run build
# or directly:
bun build src/index.ts --compile --outfile chartjs2img
```

This produces `./chartjs2img`. Copy it anywhere on your `PATH`:

```bash
mv chartjs2img ~/.local/bin/
chartjs2img serve --port 3000
```

The binary has **no runtime dependency on Bun or Node.js**. Chromium is
still auto-downloaded on first run if none is found.

## Option C — Docker

```bash
docker build -t chartjs2img .
docker run -p 3000:3000 chartjs2img
```

The Docker image includes:

- Bun runtime
- Puppeteer-compatible Chromium (headless)
- Noto Sans CJK fonts (Japanese / Chinese / Korean — no tofu)

See [Docker](./docker) for Compose examples and env-var configuration.

## Chromium / Chrome detection

On first render, chartjs2img searches for a browser in this order:

1. **`CHROMIUM_PATH`** environment variable — explicit override wins.
2. **Puppeteer browser cache** — `~/.cache/puppeteer/`, etc.
3. **System-installed Chrome/Chromium** — `/Applications/Google Chrome.app`, `/usr/bin/google-chrome`, etc.
4. **Auto-download** — [Chrome for Testing](https://googlechromelabs.github.io/chrome-for-testing/) is pulled into the user cache dir (no sudo required).

Auto-download is available for **macOS (x64/arm64)**, **Windows (x64/x86)**, and **Linux (x64)**.

### Linux ARM64 (manual install required)

Chrome for Testing does **not** publish linux-arm64 builds. Install
Chromium yourself and point `CHROMIUM_PATH` at it:

```bash
# Debian / Ubuntu
sudo apt install chromium-browser   # or `chromium`

# then, for the current shell:
export CHROMIUM_PATH=/usr/bin/chromium-browser
chartjs2img serve
```

You can also set it in the systemd unit / Docker run environment to
persist it.

## Verifying the install

```bash
chartjs2img --help         # usage banner
chartjs2img llm | head     # LLM-oriented reference (first few lines)
```

For a full smoke test:

```bash
echo '{"type":"bar","data":{"labels":["A","B"],"datasets":[{"data":[1,2]}]}}' \
  | chartjs2img render -o /tmp/hello.png
open /tmp/hello.png         # macOS; xdg-open on Linux
```

If that works you're ready. Head to [HTTP API](./http-api) or [CLI](./cli).
