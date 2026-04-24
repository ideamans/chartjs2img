---
layout: page
title: chartjs2img
landing:
  hero:
    name: chartjs2img
    text: Chart.js charts, rendered anywhere.
    primary:
      text: Get started
      link: /en/guide/
    ai:
      text: Use with AI agents
      link: /en/ai/
    secondary:
      text: View on GitHub
      link: https://github.com/ideamans/chartjs2img

  concept:
    title: One JSON, two destinations
    intro: Chart.js renders the same configuration in a browser for an interactive chart. chartjs2img takes that same JSON and returns a PNG you can attach to Slack, an email, or a PDF report — no browser required on the receiving side.
    image: /diagrams/landing-two-flows.svg
    alt: Diagram — Chart.js JSON branches into two flows. Top path goes into Chart.js and renders live inside a browser. Bottom path goes into chartjs2img which produces a PNG, then the PNG is attached to Slack and email.

  features:
    items:
      - title: Chart.js + 12 plugins bundled
        body: Core plus datalabels, annotation, zoom, gradient, treemap, matrix, sankey, wordcloud, geo, graph, venn, and the date-fns adapter. No extra installation.
      - title: HTTP API + CLI
        body: POST JSON, get an image back. Or pipe JSON into the CLI and redirect to a file. Same engine, cache, and plugin bundle.
      - title: Hash-based caching
        body: Identical requests return cached images instantly. SHA-256 hashes travel in headers so clients can build CDN-friendly URLs.
      - title: LLM-native
        body: "`chartjs2img llm` dumps the full Chart.js + plugin reference as Markdown. Pipe it into an agent to get valid configs first try."

  example:
    title: JSON in, image out
    intro: Send any Chart.js configuration as JSON; chartjs2img returns the rendered PNG. Left is the exact output of the config on the right.
    name: bar-chart
    previewLabel: Rendered PNG (800 × 600)
    sourceLabel: Chart.js configuration (JSON)

  showcase:
    eyebrow: Showcase
    title: Complex charts render, too
    intro: Multi-plugin composites — time axes, annotations, data labels, stacked and dual-axis layouts — all from a single JSON request.
    items:
      - name: showcase-revenue-with-forecast
        title: Revenue with forecast band
        body: Time-series line + gradient stroke, forecast window (annotation), goal threshold, peak-point marker, and on-point data labels.
      - name: showcase-ops-dashboard
        title: Ops dashboard snapshot
        body: Stacked-bar ticket backlog with an overlay SLA-breach-rate line on a secondary Y axis, plus threshold line and peak-load window annotations.

  aiReady:
    eyebrow: AI-native
    title: Built for LLM agents out of the box
    intro: Four first-class integration channels — pick whichever host you already use. Every path speaks the same Chart.js JSON shape, so your configs stay portable between agents.
    items:
      - title: Claude Code plugin
        body: Marketplace plugin with /chartjs2img-install, /chartjs2img-author, /chartjs2img-render slash commands.
        link: /en/ai/claude-plugin
        linkText: Tutorial →
      - title: gh skill
        body: Install the same skill bundle into Copilot, Cursor, Gemini CLI, or Codex with one `gh` command.
        link: /en/ai/gh-skill
        linkText: Tutorial →
      - title: context7 (MCP)
        body: Zero-install doc retrieval — any MCP-capable agent can query chartjs2img's full reference.
        link: /en/ai/context7
        linkText: Tutorial →
      - title: llms.txt
        body: Public discovery files at the site root. curl-able index and ~165 KB full-bundle for context windows.
        link: /en/ai/llms-txt
        linkText: Reference →

  finalCta:
    title: Ready to render?
    text: No signup, no API key — everything runs locally.
    primary:
      text: Read the guide
      link: /en/guide/
    ai:
      text: Use with AI agents
      link: /en/ai/
    secondary:
      text: GitHub
      link: https://github.com/ideamans/chartjs2img

  acknowledgments:
    title: Built on open source
    intro: chartjs2img stands on the shoulders of these projects. Licenses and notices are reproduced inside the Docker image and the source tree.
---

<Landing />
