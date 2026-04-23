---
layout: home
title: chartjs2img

hero:
  name: chartjs2img
  text: Chart.js charts, rendered anywhere.
  tagline: A CLI + HTTP service that turns Chart.js JSON into PNG/JPEG/WebP via headless Chromium. Built for contexts without a browser — emails, PDFs, slide decks, Slack bots — and for LLM agents that write Chart.js configs.
  actions:
    - theme: brand
      text: Get started
      link: /en/guide/
    - theme: alt
      text: Use with AI agents
      link: /en/ai/
    - theme: alt
      text: View on GitHub
      link: https://github.com/ideamans/chartjs2img

features:
  - title: 12 Chart.js plugins bundled
    details: Core + datalabels, annotation, zoom, gradient, treemap, matrix, sankey, wordcloud, geo, graph, venn, dayjs adapter. No extra installation.
  - title: HTTP API + CLI
    details: POST JSON, get an image back. Or pipe JSON into the CLI and redirect to a file. Same engine, same cache, same plugins.
  - title: Hash-based caching
    details: Identical requests return cached images instantly. The SHA-256 hash travels in response headers so clients can build CDN-friendly URLs.
  - title: Concurrency + crash recovery
    details: Configurable semaphore, auto-restarting browser, orphan-tab reaper. Safe to run as a long-lived service.
  - title: Error feedback
    details: Chart.js errors and warnings are captured from the browser console and returned via X-Chart-Messages (HTTP) or stderr (CLI). Never guess why a chart is blank.
  - title: Japanese text support
    details: Noto Sans CJK bundled in the Docker image. No tofu, no font fallback drama, for JA / ZH / KO labels.
  - title: Single binary
    details: bun build --compile produces a standalone executable. Chromium is auto-downloaded on first run.
  - title: LLM-native
    details: "`chartjs2img llm` dumps the full Chart.js + plugin reference as Markdown. Pipe it into an agent to get valid configs first try."
---
