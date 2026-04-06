export const doc = `## chartjs-adapter-dayjs-4 1.0.4 — Day.js Date Adapter for Time Axes

This adapter is **pre-loaded** and enables the \`"time"\` and \`"timeseries"\` scale types.

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
            "day": "MMM D",
            "month": "MMM YYYY"
          },
          "tooltipFormat": "YYYY-MM-DD",
          "parser": "YYYY-MM-DD"
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
| \`displayFormats\` | object | — | Day.js format string per unit |
| \`parser\` | string | — | Input date parse format (Day.js format string) |
| \`tooltipFormat\` | string | — | Tooltip date format |
| \`round\` | string | — | Round dates to unit start |
| \`minUnit\` | string | \`"millisecond"\` | Minimum display granularity |
| \`isoWeekday\` | boolean\\|number | \`false\` | ISO week start (0=Sun, 1=Mon, etc.) |

### Default Display Formats

| Unit | Format |
|------|--------|
| \`millisecond\` | \`h:mm:ss.SSS a\` |
| \`second\` | \`h:mm:ss a\` |
| \`minute\` | \`h:mm a\` |
| \`hour\` | \`hA\` |
| \`day\` | \`MMM D\` |
| \`week\` | \`ll\` |
| \`month\` | \`MMM YYYY\` |
| \`quarter\` | \`[Q]Q - YYYY\` |
| \`year\` | \`YYYY\` |
| \`datetime\` | \`MMM D, YYYY, h:mm:ss a\` |

### Data Formats

Time scale accepts dates in various formats:
- ISO 8601 string: \`"2024-01-15"\`, \`"2024-01-15T10:30:00Z"\`
- Millisecond timestamps: \`1705305600000\`
- Day.js-parseable strings (when \`parser\` is set)

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
          "displayFormats": { "day": "MMM D" },
          "tooltipFormat": "YYYY-MM-DD"
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
