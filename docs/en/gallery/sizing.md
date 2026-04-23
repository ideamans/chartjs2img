---
title: Sizing
description: Examples of non-default canvas sizes - small 400x300 thumbnails and wide 1200x400 banners.
---

# Sizing

The default is 800×600 pixels. The `width` and `height` HTTP/CLI
options override it. Device pixel ratio (`devicePixelRatio`) is
separate — it scales the image up for retina screens but doesn't
affect the chart's content area.

## Small size (400×300)

![small 400x300](/examples/16-small-size-400x300.png)

Typical for inline thumbnails or email headers.

```json
{
  "type": "pie",
  "data": {
    "labels": ["A","B","C"],
    "datasets": [{ "data": [1,2,3] }]
  }
}
```

Render command:

```bash
curl -X POST http://localhost:3000/render \
  -H 'Content-Type: application/json' \
  -d '{"chart":<json above>,"width":400,"height":300}' \
  -o small.png
```

## Wide chart (1200×400)

![wide 1200x400](/examples/17-wide-chart-1200x400.png)

Banner / sparkline-style.

```json
{
  "type": "line",
  "data": {
    "labels": ["1","2","3","4","5","6","7","8","9","10","11","12"],
    "datasets": [
      { "label": "Trend", "data": [5,10,8,15,12,20,18,25,22,30,28,35], "borderColor": "rgb(75,192,192)", "tension": 0.3 }
    ]
  }
}
```

## Tips

- **The canvas doesn't reflow for `options.responsive: true` in chartjs2img.** We set it internally so the chart fills the container, but the container is sized by `width` / `height` at request time.
- **Aspect ratio is usually implicit.** `maintainAspectRatio` is set to `false` inside the template, so your `width` × `height` is what you get.
- **Device pixel ratio multiplies output pixels, not chart detail.** `devicePixelRatio: 2` at `800×600` produces a 1600×1200 PNG — the chart renders at 800×600 CSS pixels, then the canvas is exported at 2× resolution. Good for retina screens; bad if you want a small file.
- **The screenshot is of `#chart-container`**, not the page. No HTML chrome, no margin, no surrounding white space beyond what you put in the chart itself.
