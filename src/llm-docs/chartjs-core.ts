export const doc = `## Chart.js 4.4.9 — Core Configuration

### Top-Level Structure

\`\`\`json
{
  "type": "<chart-type>",
  "data": {
    "labels": ["Label1", "Label2", ...],
    "datasets": [{ "label": "Series", "data": [...], ... }]
  },
  "options": {
    "indexAxis": "x",
    "plugins": { ... },
    "scales": { ... },
    "layout": { "padding": 10 },
    "interaction": { "mode": "nearest", "intersect": true }
  }
}
\`\`\`

### Built-in Chart Types

\`bar\`, \`line\`, \`pie\`, \`doughnut\`, \`radar\`, \`polarArea\`, \`scatter\`, \`bubble\`

### Bar Chart Dataset

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| \`data\` | number[] | **required** | Data values |
| \`label\` | string | \`""\` | Dataset label |
| \`backgroundColor\` | Color\\|Color[] | — | Bar fill color(s) |
| \`borderColor\` | Color\\|Color[] | — | Bar border color(s) |
| \`borderWidth\` | number\\|object | \`0\` | Border width (\`{top,right,bottom,left}\`) |
| \`borderRadius\` | number\\|object | \`0\` | Corner radius |
| \`borderSkipped\` | string\\|boolean | \`"start"\` | Which edge to skip (\`"start"\`, \`"end"\`, \`"middle"\`, \`"bottom"\`, \`"left"\`, \`"top"\`, \`"right"\`, \`false\`) |
| \`barPercentage\` | number | \`0.9\` | Bar width as fraction of category |
| \`categoryPercentage\` | number | \`0.8\` | Category width as fraction of available space |
| \`barThickness\` | number\\|string | — | Fixed bar width in px, or \`"flex"\` |
| \`maxBarThickness\` | number | — | Maximum bar width in px |
| \`minBarLength\` | number | — | Minimum bar length in px |
| \`indexAxis\` | string | \`"x"\` | Set to \`"y"\` for horizontal bars |
| \`grouped\` | boolean | \`true\` | Group bars of different datasets |
| \`stack\` | string | — | Stack group identifier |
| \`order\` | number | \`0\` | Drawing order |
| \`base\` | number | — | Base value for the bar |

### Line Chart Dataset

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| \`data\` | number[]\\|{x,y}[] | **required** | Data values |
| \`label\` | string | \`""\` | Dataset label |
| \`backgroundColor\` | Color | — | Fill color (when \`fill\` is set) |
| \`borderColor\` | Color | — | Line color |
| \`borderWidth\` | number | \`3\` | Line width |
| \`borderDash\` | number[] | \`[]\` | Dash pattern (e.g., \`[5, 5]\`) |
| \`borderDashOffset\` | number | \`0\` | Dash offset |
| \`borderCapStyle\` | string | \`"butt"\` | Line cap: \`"butt"\`, \`"round"\`, \`"square"\` |
| \`borderJoinStyle\` | string | \`"miter"\` | Line join: \`"bevel"\`, \`"round"\`, \`"miter"\` |
| \`fill\` | boolean\\|string\\|object | \`false\` | Fill area. \`true\`, \`"origin"\`, \`"start"\`, \`"end"\`, \`{target, above, below}\` |
| \`tension\` | number | \`0\` | Bezier curve tension (\`0\` = straight, \`0.4\` = smooth) |
| \`stepped\` | boolean\\|string | \`false\` | Stepped line: \`true\`, \`"before"\`, \`"after"\`, \`"middle"\` |
| \`cubicInterpolationMode\` | string | \`"default"\` | \`"default"\` or \`"monotone"\` |
| \`showLine\` | boolean | \`true\` | Draw the line |
| \`spanGaps\` | boolean\\|number | — | Connect across null values |
| \`pointBackgroundColor\` | Color | — | Point fill |
| \`pointBorderColor\` | Color | — | Point border |
| \`pointBorderWidth\` | number | \`1\` | Point border width |
| \`pointRadius\` | number | \`3\` | Point size (\`0\` to hide) |
| \`pointStyle\` | string | \`"circle"\` | \`"circle"\`, \`"cross"\`, \`"crossRot"\`, \`"dash"\`, \`"line"\`, \`"rect"\`, \`"rectRounded"\`, \`"rectRot"\`, \`"star"\`, \`"triangle"\`, \`false\` |
| \`pointHitRadius\` | number | \`1\` | Hit detection radius |
| \`pointHoverRadius\` | number | \`4\` | Hover size |
| \`order\` | number | \`0\` | Drawing order |
| \`stack\` | string | — | Stack group (for stacked area) |

### Pie / Doughnut Dataset

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| \`data\` | number[] | **required** | Slice values |
| \`backgroundColor\` | Color[] | — | Slice colors |
| \`borderColor\` | Color | \`"#fff"\` | Border between slices |
| \`borderWidth\` | number | \`2\` | Border width |
| \`borderRadius\` | number\\|object | \`0\` | Slice corner radius |
| \`borderAlign\` | string | \`"center"\` | \`"center"\` or \`"inner"\` |
| \`circumference\` | number | — | Sweep angle per dataset (degrees) |
| \`hoverOffset\` | number | \`0\` | Hover expansion |
| \`offset\` | number\\|number[] | \`0\` | Slice offset from center |
| \`rotation\` | number | — | Starting angle (degrees) |
| \`spacing\` | number | \`0\` | Gap between slices |
| \`weight\` | number | \`1\` | Relative thickness (multi-dataset) |

For doughnut, also set \`options.cutout\` (default \`"50%"\`) to control the hole size.

### Radar Dataset

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| \`data\` | number[] | **required** | Values per axis |
| \`label\` | string | \`""\` | Dataset label |
| \`backgroundColor\` | Color | — | Fill color |
| \`borderColor\` | Color | — | Line color |
| \`borderWidth\` | number | \`3\` | Line width |
| \`fill\` | boolean\\|string | \`false\` | Fill area |
| \`pointBackgroundColor\` | Color | — | Point fill |
| \`pointBorderColor\` | Color | — | Point border |
| \`pointRadius\` | number | \`3\` | Point size |
| \`pointStyle\` | string | \`"circle"\` | Point shape |
| \`tension\` | number | \`0\` | Curve tension |

### Polar Area Dataset

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| \`data\` | number[] | **required** | Slice values |
| \`backgroundColor\` | Color[] | — | Slice colors |
| \`borderColor\` | Color | \`"#fff"\` | Border color |
| \`borderWidth\` | number | \`2\` | Border width |

### Scatter Dataset

Same as Line chart, but \`showLine\` defaults to \`false\`. Data must be \`{x, y}\` objects:

\`\`\`json
{ "data": [{"x": 10, "y": 20}, {"x": 15, "y": 10}] }
\`\`\`

### Bubble Dataset

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| \`data\` | {x,y,r}[] | **required** | Bubble positions and radius |
| \`backgroundColor\` | Color | — | Fill color |
| \`borderColor\` | Color | — | Border color |
| \`borderWidth\` | number | \`3\` | Border width |
| \`pointStyle\` | string | \`"circle"\` | Marker shape |
| \`radius\` | number | \`3\` | Default radius (overridden by \`r\` in data) |
| \`rotation\` | number | \`0\` | Rotation in degrees |

### Scales Configuration

\`options.scales\` is an object where keys are scale IDs (e.g., \`"x"\`, \`"y"\`, \`"r"\`):

\`\`\`json
{
  "scales": {
    "x": { "type": "category", "title": { "display": true, "text": "Month" } },
    "y": { "type": "linear", "beginAtZero": true, "max": 100 }
  }
}
\`\`\`

#### Scale Types

| Type | Usage | Key Properties |
|------|-------|----------------|
| \`linear\` | Numeric data | \`min\`, \`max\`, \`beginAtZero\`, \`suggestedMin\`, \`suggestedMax\`, \`grace\` |
| \`logarithmic\` | Log scale | \`min\`, \`max\` |
| \`category\` | Discrete labels | \`labels\`, \`min\`, \`max\` |
| \`time\` | Dates (requires dayjs adapter) | \`time.unit\`, \`time.displayFormats\`, \`time.parser\`, \`time.tooltipFormat\` |
| \`timeseries\` | Even-spaced time data | Same as \`time\` |
| \`radialLinear\` | Radar / polar area | \`angleLines\`, \`pointLabels\`, \`ticks\`, \`min\`, \`max\` |

#### Common Scale Options

| Property | Type | Description |
|----------|------|-------------|
| \`type\` | string | Scale type (see above) |
| \`display\` | boolean | Show the scale |
| \`position\` | string | \`"top"\`, \`"left"\`, \`"bottom"\`, \`"right"\` |
| \`min\` | number | Minimum value |
| \`max\` | number | Maximum value |
| \`reverse\` | boolean | Reverse the scale |
| \`stacked\` | boolean\\|string | Enable stacking |
| \`offset\` | boolean | Extra space at edges |
| \`title.display\` | boolean | Show axis title |
| \`title.text\` | string | Axis title text |
| \`title.color\` | Color | Title color |
| \`title.font\` | Font | Title font |
| \`ticks.display\` | boolean | Show tick labels |
| \`ticks.color\` | Color | Tick label color |
| \`ticks.font\` | Font | Tick label font |
| \`ticks.stepSize\` | number | Fixed step between ticks |
| \`ticks.maxTicksLimit\` | number | Max number of ticks |
| \`ticks.precision\` | number | Decimal precision |
| \`grid.display\` | boolean | Show grid lines |
| \`grid.color\` | Color | Grid line color |
| \`grid.lineWidth\` | number | Grid line width |
| \`border.display\` | boolean | Show axis border line |
| \`border.color\` | Color | Border color |

### Title Plugin (\`options.plugins.title\`)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| \`display\` | boolean | \`false\` | Show the title |
| \`text\` | string\\|string[] | \`""\` | Title text (array for multiline) |
| \`color\` | Color | — | Text color |
| \`font\` | Font | \`{weight:"bold"}\` | Font config |
| \`position\` | string | \`"top"\` | \`"top"\`, \`"left"\`, \`"bottom"\`, \`"right"\` |
| \`align\` | string | \`"center"\` | \`"start"\`, \`"center"\`, \`"end"\` |
| \`padding\` | number\\|object | \`10\` | Padding around title |
| \`fullSize\` | boolean | \`true\` | Span full width/height |

### Subtitle Plugin (\`options.plugins.subtitle\`)

Same options as title. Rendered below the title.

### Legend Plugin (\`options.plugins.legend\`)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| \`display\` | boolean | \`true\` | Show the legend |
| \`position\` | string | \`"top"\` | \`"top"\`, \`"left"\`, \`"bottom"\`, \`"right"\` |
| \`align\` | string | \`"center"\` | \`"start"\`, \`"center"\`, \`"end"\` |
| \`reverse\` | boolean | \`false\` | Reverse dataset order |
| \`labels.boxWidth\` | number | \`40\` | Color box width |
| \`labels.boxHeight\` | number | — | Color box height |
| \`labels.color\` | Color | — | Text color |
| \`labels.font\` | Font | — | Font config |
| \`labels.padding\` | number | \`10\` | Padding between items |
| \`labels.usePointStyle\` | boolean | \`false\` | Use point style instead of box |
| \`labels.pointStyle\` | string | — | Override point style |
| \`title.display\` | boolean | \`false\` | Show legend title |
| \`title.text\` | string | — | Legend title text |

### Tooltip Plugin (\`options.plugins.tooltip\`)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| \`enabled\` | boolean | \`true\` | Enable tooltips |
| \`mode\` | string | \`interaction.mode\` | Interaction mode (inherits from \`options.interaction.mode\`, default \`"nearest"\`) |
| \`intersect\` | boolean | \`interaction.intersect\` | Require direct hover (inherits from \`options.interaction.intersect\`, default \`true\`) |
| \`position\` | string | \`"average"\` | \`"average"\` or \`"nearest"\` |
| \`backgroundColor\` | Color | \`"rgba(0,0,0,0.8)"\` | Background |
| \`titleColor\` | Color | \`"#fff"\` | Title color |
| \`titleFont\` | Font | \`{weight:"bold"}\` | Title font |
| \`bodyColor\` | Color | \`"#fff"\` | Body text color |
| \`bodyFont\` | Font | — | Body font |
| \`footerColor\` | Color | \`"#fff"\` | Footer color |
| \`cornerRadius\` | number | \`6\` | Corner radius |
| \`displayColors\` | boolean | \`true\` | Show color boxes |
| \`borderColor\` | Color | — | Border color |
| \`borderWidth\` | number | \`0\` | Border width |
| \`padding\` | number\\|object | \`6\` | Inner padding |
| \`caretSize\` | number | \`5\` | Caret triangle size |
| \`usePointStyle\` | boolean | \`false\` | Use point style in tooltip |
| \`xAlign\` | string | — | \`"left"\`, \`"center"\`, \`"right"\` |
| \`yAlign\` | string | — | \`"top"\`, \`"center"\`, \`"bottom"\` |

### Font Object

Wherever \`Font\` is used:

\`\`\`json
{ "family": "Arial", "size": 14, "style": "normal", "weight": "bold", "lineHeight": 1.2 }
\`\`\`

### Color Values

Any CSS color string: \`"red"\`, \`"#ff0000"\`, \`"rgb(255,0,0)"\`, \`"rgba(255,0,0,0.5)"\`, \`"hsl(0,100%,50%)"\`
`
