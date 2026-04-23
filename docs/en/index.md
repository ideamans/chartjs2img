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

  features:
    items:
      - title: Chart.js + 12 plugins bundled
        body: Core plus datalabels, annotation, zoom, gradient, treemap, matrix, sankey, wordcloud, geo, graph, venn, and the dayjs adapter. No extra installation.
      - title: HTTP API + CLI
        body: POST JSON, get an image back. Or pipe JSON into the CLI and redirect to a file. Same engine, cache, and plugin bundle.
      - title: Hash-based caching
        body: Identical requests return cached images instantly. SHA-256 hashes travel in headers so clients can build CDN-friendly URLs.
      - title: LLM-native
        body: "`chartjs2img llm` dumps the full Chart.js + plugin reference as Markdown. Pipe it into an agent to get valid configs first try."

  aiReady:
    eyebrow: AI-native
    title: Built for LLM agents out of the box
    intro: Four first-class integration channels — pick whichever host you already use. Every path speaks the same Chart.js JSON shape, so your configs stay portable between agents.
    items:
      - title: Claude Code plugin
        body: Marketplace plugin with /chartjs2img-install, /chartjs2img-llm, /chartjs2img-author, /chartjs2img-render slash commands.
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
