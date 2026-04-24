---
title: Sizing
description: Examples of non-default canvas sizes - small 400x300 thumbnails and wide 1200x400 banners.
---

# Sizing

The default is 800 × 600 pixels. The `width` and `height` HTTP/CLI
options override it. Device pixel ratio (`devicePixelRatio`) is
separate — it scales the image up for retina screens but doesn't
affect the chart's content area.

## Small size (400 × 300)

Typical for inline thumbnails or email headers.

<Example name="small-size-400x300" http caption="Renders at 400×300." />

## Wide chart (1200 × 400)

Banner / sparkline-style.

<Example name="wide-chart-1200x400" http caption="Renders at 1200×400." />

## Tips

- **The canvas doesn't reflow for `options.responsive: true` in
  chartjs2img.** We set it internally so the chart fills the
  container, but the container is sized by `width` / `height` at
  request time.
- **Aspect ratio is usually implicit.** `maintainAspectRatio` is set
  to `false` inside the template, so your `width` × `height` is what
  you get.
- **Device pixel ratio multiplies output pixels, not chart detail.**
  `devicePixelRatio: 2` at 800 × 600 produces a 1600 × 1200 PNG — the
  chart renders at 800 × 600 CSS pixels, then the canvas is exported
  at 2× resolution. Good for retina screens; bad if you want a small
  file.
- **The screenshot is of `#chart-container`**, not the page. No HTML
  chrome, no margin, no surrounding white space beyond what you put
  in the chart itself.
