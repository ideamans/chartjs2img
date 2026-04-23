---
title: CLI
description: Every chartjs2img CLI subcommand - serve, render, examples, llm, help - and their options.
---

# CLI

The `chartjs2img` binary has four operating modes plus a help screen.
When running from source, prefix with `bun run src/index.ts`; for the
compiled binary or a PATH-installed version, use `chartjs2img` directly.

```bash
chartjs2img <command> [options]
```

## `chartjs2img serve`

Starts the HTTP server. See [HTTP API](./http-api) for endpoints.

```bash
chartjs2img serve --port 8080 --api-key secret
```

| Flag               | Default | Environment var | Description                  |
| ------------------ | ------- | --------------- | ---------------------------- |
| `--port, -p`       | `3000`  | `PORT`          | TCP listen port              |
| `--host`           | `0.0.0.0` | `HOST`        | Bind address                 |
| `--api-key`        | *(none)* | `API_KEY`      | Enable auth with this token  |

Other behavior (concurrency, cache, page timeout) is configured via
environment variables only — see [Environment variables](./env-vars).

## `chartjs2img render`

Render a single chart from JSON and write the image. Good for CI,
Makefile targets, or one-off scripting.

```bash
# from a file
chartjs2img render -i chart.json -o chart.png

# from stdin (default)
echo '{"type":"bar","data":{"labels":["A","B"],"datasets":[{"data":[1,2]}]}}' \
  | chartjs2img render -o chart.png

# to stdout
chartjs2img render -i chart.json > chart.png

# JPEG with custom dimensions
chartjs2img render -i chart.json -o chart.jpg -w 1200 -h 400 -f jpeg -q 85
```

| Flag                          | Default    | Description                                           |
| ----------------------------- | ---------- | ----------------------------------------------------- |
| `-i, --input <file>`          | stdin      | Input JSON file, or `-` for stdin                     |
| `-o, --output <file>`         | stdout     | Output image file, or `-` for stdout                  |
| `-w, --width <px>`            | `800`      | Canvas width                                          |
| `-h, --height <px>`           | `600`      | Canvas height                                         |
| `--device-pixel-ratio <n>`    | `2`        | Retina scale factor                                   |
| `--background-color <color>`  | `white`    | CSS color, or `transparent`                           |
| `-f, --format <fmt>`          | `png`      | `png` / `jpeg` / `webp`                               |
| `-q, --quality <0-100>`       | `90`       | Quality for JPEG / WebP                               |

**Input shape for `render`** is the Chart.js config directly — no
outer `chart` wrapper (unlike the HTTP body). When piping into the CLI,
the JSON is interpreted as the chart config.

Chart.js errors and warnings are printed to stderr; see
[Error feedback](./error-feedback).

## `chartjs2img examples`

Render every built-in example into an output directory. Useful for
visual smoke-testing a new plugin or a new browser binary.

```bash
chartjs2img examples -o ./out
# or as JPEG
chartjs2img examples -o ./out -f jpeg -q 80
```

| Flag                    | Default       | Description                |
| ----------------------- | ------------- | -------------------------- |
| `--outdir, -o <dir>`    | `./examples`  | Output directory           |
| `-f, --format <fmt>`    | `png`         | `png` / `jpeg`             |
| `-q, --quality <0-100>` | `90`          | JPEG quality               |

The list of examples lives in `src/examples.ts`.

## `chartjs2img llm`

Print the full Chart.js + plugin reference as Markdown. Designed for
piping into an LLM context window.

```bash
chartjs2img llm | pbcopy                              # macOS clipboard
chartjs2img llm > reference.md                        # save to file
chartjs2img llm | llm -s "Generate a pie chart..."    # pipe to an LLM CLI
```

The output is ~1400 lines of structured Markdown: usage guide, Chart.js
core, every plugin's option table with JSON examples, and caveats.

Each module's content lives in `src/llm-docs/<module>.ts`; the
aggregator is `src/llm-docs/index.ts`. See the Developer Guide for how
to extend.

## `chartjs2img help` / `--help`

Prints the usage banner: every command, every flag, every environment
variable.

## `chartjs2img version` / `--version`

Prints the version from `src/version.ts`.

## Exit codes

- `0` — success
- Non-zero — argument error, I/O failure, or Chromium launch failure

Chart.js runtime errors (invalid chart `type`, missing plugin, etc.) do
**not** cause a non-zero exit. They are surfaced via the
`X-Chart-Messages` header (HTTP) or stderr (CLI) — see
[Error feedback](./error-feedback).
