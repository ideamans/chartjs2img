export const doc = `## chartjs-adapter-date-fns 3.0.0 — date-fns Date Adapter for Time Axes

This adapter is **pre-loaded** (as a bundle that also contains date-fns
itself) and enables the \`"time"\` and \`"timeseries"\` scale types.

### Time Scale Configuration

\`\`\`json
{
  "options": {
    "scales": {
      "x": {
        "type": "time",
        "time": {
          "unit": "day",
          "displayFormats": {
            "day": "MMM d",
            "month": "MMM yyyy"
          },
          "tooltipFormat": "yyyy-MM-dd",
          "parser": "yyyy-MM-dd"
        },
        "title": {
          "display": true,
          "text": "Date"
        }
      }
    }
  }
}
\`\`\`

### Time Options (\`scales.x.time\`)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| \`unit\` | string | auto | Display unit: \`"millisecond"\`, \`"second"\`, \`"minute"\`, \`"hour"\`, \`"day"\`, \`"week"\`, \`"month"\`, \`"quarter"\`, \`"year"\` |
| \`displayFormats\` | object | — | date-fns format string per unit |
| \`parser\` | string | — | Input date parse format (date-fns format string) |
| \`tooltipFormat\` | string | — | Tooltip date format |
| \`round\` | string | — | Round dates to unit start |
| \`minUnit\` | string | \`"millisecond"\` | Minimum display granularity |
| \`isoWeekday\` | boolean\\|number | \`false\` | ISO week start (0=Sun, 1=Mon, etc.) |

### Format token differences vs Day.js

date-fns tokens are **case-sensitive** and differ from Day.js:

| What you want         | date-fns | Day.js (NOT this adapter) |
|-----------------------|----------|---------------------------|
| 4-digit year          | \`yyyy\` | \`YYYY\` |
| Month (Jan)           | \`MMM\`  | \`MMM\`  |
| Day of month (1..31)  | \`d\`    | \`D\`    |
| Hour (0..23)          | \`H\`    | \`H\`    |
| Minute                | \`mm\`   | \`mm\`   |

If Chart.js throws an error of the form **Use d instead of D**, you
are using Day.js-style tokens in a date-fns format string — rewrite
them to the date-fns column above.

### Data Formats

Time scale accepts dates in various formats:
- ISO 8601 string: \`"2024-01-15"\`, \`"2024-01-15T10:30:00Z"\`
- Millisecond timestamps: \`1705305600000\`
- date-fns-parseable strings (when \`parser\` is set)

### Example: Time Series Line Chart

\`\`\`json
{
  "type": "line",
  "data": {
    "datasets": [{
      "label": "Daily Sales",
      "data": [
        { "x": "2024-01-01", "y": 100 },
        { "x": "2024-01-02", "y": 150 },
        { "x": "2024-01-03", "y": 120 },
        { "x": "2024-01-04", "y": 200 },
        { "x": "2024-01-05", "y": 180 }
      ],
      "borderColor": "#36a2eb",
      "fill": false,
      "tension": 0.3
    }]
  },
  "options": {
    "scales": {
      "x": {
        "type": "time",
        "time": {
          "unit": "day",
          "displayFormats": { "day": "MMM d" },
          "tooltipFormat": "yyyy-MM-dd"
        }
      },
      "y": {
        "beginAtZero": true
      }
    }
  }
}
\`\`\`
`
