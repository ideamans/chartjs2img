export const doc = `## chartjs-plugin-annotation 3.1.0 — Lines, Boxes, Labels as Overlays

Configure via \`options.plugins.annotation.annotations\`. The value is an object where each key is an annotation ID.

### Common Options (All Types)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| \`type\` | string | — | \`"line"\`, \`"box"\`, \`"ellipse"\`, \`"point"\`, \`"polygon"\`, \`"label"\` |
| \`display\` | boolean | \`true\` | Visibility |
| \`drawTime\` | string | \`"afterDatasetsDraw"\` | \`"beforeDraw"\`, \`"beforeDatasetsDraw"\`, \`"afterDatasetsDraw"\`, \`"afterDraw"\` |
| \`xScaleID\` | string | \`undefined\` | X scale to bind to (defaults to detecting \`"x"\` axis) |
| \`yScaleID\` | string | \`undefined\` | Y scale to bind to (defaults to detecting \`"y"\` axis) |
| \`xMin\` | number\\|string | — | Left bound (scale value) |
| \`xMax\` | number\\|string | — | Right bound |
| \`yMin\` | number\\|string | — | Bottom bound |
| \`yMax\` | number\\|string | — | Top bound |
| \`backgroundColor\` | Color | \`options.color\` | Fill color |
| \`borderColor\` | Color | \`options.color\` | Stroke color |
| \`borderWidth\` | number | type-dependent | Stroke width (line: \`2\`, label: \`0\`, others: \`1\`) |
| \`borderDash\` | number[] | \`[]\` | Dash pattern (e.g., \`[6, 6]\`) |
| \`z\` | number | \`0\` | Drawing stack order |
| \`adjustScaleRange\` | boolean | \`true\` | Expand scale if annotation is out of range |

### Line Annotation

Draws a horizontal or vertical line (or angled line).

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| \`scaleID\` | string | — | Scale to position on (\`"x"\` or \`"y"\`) |
| \`value\` | number\\|string | — | Position on the scale |
| \`endValue\` | number\\|string | — | End position (for angled lines) |
| \`borderWidth\` | number | \`2\` | Line width |
| \`curve\` | boolean | \`false\` | Draw as Bezier curve |
| \`controlPoint\` | number\\|string\\|object | \`{y:"-50%"}\` | Bezier curve control point (when \`curve\` is \`true\`) |
| \`label\` | object | — | Label on the line (see below) |
| \`arrowHeads\` | object | — | Arrow heads at line ends |

**Line label:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| \`display\` | boolean | \`false\` | Show label |
| \`content\` | string\\|string[] | — | Label text |
| \`color\` | Color | \`"#fff"\` | Text color |
| \`backgroundColor\` | Color | \`"rgba(0,0,0,0.8)"\` | Background |
| \`font\` | Font | \`{weight:"bold"}\` | Font config |
| \`padding\` | number\\|object | \`6\` | Inner padding |
| \`borderRadius\` | number | \`6\` | Corner radius |
| \`textAlign\` | string | \`"center"\` | Text alignment |
| \`position\` | string | \`"center"\` | \`"start"\`, \`"center"\`, \`"end"\`, or percentage \`"25%"\` |
| \`rotation\` | number\\|string | \`0\` | Rotation (\`"auto"\` to follow line) |
| \`xAdjust\` | number | \`0\` | X pixel offset |
| \`yAdjust\` | number | \`0\` | Y pixel offset |

**Arrow heads:**

\`\`\`json
{ "arrowHeads": { "end": { "display": true, "length": 16, "width": 8 } } }
\`\`\`

### Box Annotation

Draws a rectangular region.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| \`borderRadius\` | number\\|object | \`0\` | Corner radius |
| \`rotation\` | number | \`0\` | Rotation in degrees |
| \`label\` | object | — | Inner label (similar to line label, but \`color\` defaults to \`"black"\`, \`textAlign\` defaults to \`"start"\`) |

Defined by \`xMin\`, \`xMax\`, \`yMin\`, \`yMax\`.

### Ellipse Annotation

Draws an elliptical region. Same bounds as box.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| \`rotation\` | number | \`0\` | Rotation in degrees |
| \`label\` | object | — | Inner label (same options as box label) |

### Point Annotation

Draws a marker at a specific data point.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| \`xValue\` | number\\|string | — | X coordinate |
| \`yValue\` | number\\|string | — | Y coordinate |
| \`radius\` | number | \`10\` | Point size in px |
| \`pointStyle\` | string | \`"circle"\` | Marker style |
| \`rotation\` | number | \`0\` | Rotation |
| \`xAdjust\` | number | \`0\` | X pixel offset |
| \`yAdjust\` | number | \`0\` | Y pixel offset |

### Polygon Annotation

Draws a regular polygon.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| \`xValue\` | number\\|string | — | Center X |
| \`yValue\` | number\\|string | — | Center Y |
| \`radius\` | number | \`10\` | Size in px |
| \`sides\` | number | \`3\` | Number of sides |
| \`rotation\` | number | \`0\` | Rotation |

### Label Annotation

Draws a standalone text label (not attached to a line/box).

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| \`xValue\` | number\\|string | — | X coordinate |
| \`yValue\` | number\\|string | — | Y coordinate |
| \`content\` | string\\|string[] | — | Text content (array for multiline) |
| \`color\` | Color | \`"black"\` | Text color |
| \`font\` | Font | — | Font config |
| \`textAlign\` | string | \`"center"\` | \`"left"\`, \`"center"\`, \`"right"\` |
| \`backgroundColor\` | Color | — | Background |
| \`borderRadius\` | number | \`0\` | Corner radius |
| \`padding\` | number\\|object | \`6\` | Padding |
| \`position\` | string | \`"center"\` | Position within bounds |
| \`rotation\` | number | \`0\` | Rotation |
| \`width\` | number\\|string | — | Fixed width |
| \`height\` | number\\|string | — | Fixed height |
| \`xAdjust\` | number | \`0\` | X offset |
| \`yAdjust\` | number | \`0\` | Y offset |

### Example: Threshold Line with Label

\`\`\`json
{
  "options": {
    "plugins": {
      "annotation": {
        "annotations": {
          "threshold": {
            "type": "line",
            "yMin": 75,
            "yMax": 75,
            "borderColor": "red",
            "borderWidth": 2,
            "borderDash": [6, 6],
            "label": {
              "display": true,
              "content": "Target: 75",
              "position": "end",
              "backgroundColor": "red",
              "color": "white"
            }
          }
        }
      }
    }
  }
}
\`\`\`
`
