#!/usr/bin/env bash
# Install the npm tarball into an empty project and use it with plain Node —
# the way a consumer does. Guards against the 0.6.0 / 0.7.1 breakage, where
# dist/ used extension-less relative imports (ERR_MODULE_NOT_FOUND under
# Node) and the `chartjs2img` bin pointed at src/index.ts, which isn't even
# in the tarball.
#
#   bash scripts/test-pack.sh              # build, pack, install, check
#   CHARTJS2IMG_TEST_BROWSER=1 bash ...    # also render with the browser engine
#
# Checks, all under `node` (never bun):
#   1. import 'chartjs2img' and render a PNG through the library API
#   2. the `chartjs2img` bin: --version, --help, llm, render (stdin and file)
#   3. `chartjs2img serve`: /health, POST /render, invalid JSON -> 400
#   4. every built-in example rendered by the installed package under Node is
#      pixel-identical to the same example rendered from source under Bun
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
WORK=$(mktemp -d "${TMPDIR:-/tmp}/chartjs2img-pack.XXXXXX")
SERVER_PID=""
cleanup() {
  if [ -n "$SERVER_PID" ]; then kill "$SERVER_PID" 2>/dev/null || true; fi
  rm -rf "$WORK"
}
trap cleanup EXIT

echo "== node $(node -v), npm $(npm -v), bun $(bun -v)"

echo "== build + pack"
cd "$ROOT"
bun run build:lib
npm pack --pack-destination "$WORK" --ignore-scripts >/dev/null
TARBALL=$(ls "$WORK"/chartjs2img-*.tgz)
VERSION=$(node -p "require('./package.json').version")

echo "== install $(basename "$TARBALL") into an empty project"
mkdir "$WORK/app"
cd "$WORK/app"
echo '{ "name": "chartjs2img-pack-test", "private": true, "type": "module" }' > package.json
npm install --no-audit --no-fund "$TARBALL"
# skia-canvas fetches its native module in an install script. Newer npm
# versions may skip unapproved install scripts; run it explicitly if missing.
if ! find node_modules/skia-canvas -name '*.node' | grep -q .; then
  echo "skia-canvas native module missing; running its install script"
  (cd node_modules/skia-canvas && node lib/prebuild.mjs download --or-compile)
fi
BIN="$WORK/app/node_modules/.bin/chartjs2img"

echo "== (1) library import + render"
cat > lib-smoke.mjs <<'EOF'
import { writeFile } from 'node:fs/promises'
import { renderChart, closeBrowser, VERSION, BUNDLED_LIBS, computeHash } from 'chartjs2img'

const chart = { type: 'bar', data: { labels: ['A', 'B', 'C'], datasets: [{ label: 'x', data: [3, 1, 2] }] } }
const engines = process.env.CHARTJS2IMG_TEST_BROWSER === '1' ? ['skia', 'browser'] : ['skia']
for (const engine of engines) {
  const r = await renderChart({ chart, width: 400, height: 300, engine })
  const sig = r.buffer.subarray(0, 8).toString('hex')
  if (sig !== '89504e470d0a1a0a') throw new Error(`${engine}: not a PNG (${sig})`)
  const w = r.buffer.readUInt32BE(16), h = r.buffer.readUInt32BE(20)
  if (w !== 400 || h !== 300) throw new Error(`${engine}: unexpected size ${w}x${h}`)
  if (r.messages.some((m) => m.level === 'error')) throw new Error(`${engine}: ${JSON.stringify(r.messages)}`)
  await writeFile(`lib-${engine}.png`, r.buffer)
  console.log(`  ${engine}: ${r.buffer.length} bytes, ${w}x${h}, hash ${r.hash}`)
}
if (VERSION !== process.argv[2]) throw new Error(`VERSION ${VERSION} != ${process.argv[2]}`)
if (!BUNDLED_LIBS || typeof computeHash({ chart }) !== 'string') throw new Error('exports missing')
await closeBrowser()
EOF
node lib-smoke.mjs "$VERSION"

echo "== (2) CLI"
"$BIN" --version | grep -qx "chartjs2img v$VERSION"
"$BIN" --help | grep -q 'COMMANDS'
LINES=$("$BIN" llm | wc -l)
echo "  llm: $LINES lines"
[ "$LINES" -gt 1000 ]
CHART='{"type":"line","data":{"labels":["a","b","c"],"datasets":[{"data":[1,3,2]}]}}'
echo "$CHART" > chart.json
echo "$CHART" | "$BIN" render -o cli-stdin.png -w 320 -h 240
"$BIN" render -i chart.json -o - > cli-stdout.png
node -e '
  const fs = require("fs")
  for (const [f, w, h] of [["cli-stdin.png", 320, 240], ["cli-stdout.png", 800, 600]]) {
    const b = fs.readFileSync(f)
    if (b.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") throw new Error(f + ": not a PNG")
    if (b.readUInt32BE(16) !== w || b.readUInt32BE(20) !== h) throw new Error(f + ": wrong size")
    console.log("  " + f + ": " + b.length + " bytes")
  }'

echo "== (3) serve"
PORT=$((30000 + RANDOM % 20000))
"$BIN" serve --port "$PORT" --host 127.0.0.1 > serve.log 2>&1 &
SERVER_PID=$!
for _ in $(seq 1 40); do
  curl -sf "http://127.0.0.1:$PORT/health" > health.json 2>/dev/null && break
  sleep 0.25
done
grep -q "\"version\":\"$VERSION\"" health.json
CODE=$(curl -s -o serve.png -w '%{http_code}' -X POST -H 'Content-Type: application/json' \
  -d "{\"chart\":$CHART,\"width\":300,\"height\":200}" "http://127.0.0.1:$PORT/render")
[ "$CODE" = 200 ]
file serve.png | grep -q 'PNG image data, 300 x 200'
CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST -d 'not json' "http://127.0.0.1:$PORT/render")
[ "$CODE" = 400 ]
kill "$SERVER_PID"
wait "$SERVER_PID" 2>/dev/null || true
SERVER_PID=""
echo "  /health, POST /render, 400 on bad JSON: ok"

echo "== (4) examples: Node (installed package) vs Bun (source)"
"$BIN" examples -o "$WORK/out-node" > /dev/null
(cd "$ROOT" && bun run src/index.ts examples -o "$WORK/out-bun" > /dev/null)
cat > compare.mjs <<'EOF'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { loadImage, Canvas } from 'skia-canvas'

const [a, b] = process.argv.slice(2)
const pixels = async (f) => {
  const img = await loadImage(f)
  const c = new Canvas(img.width, img.height)
  const ctx = c.getContext('2d')
  ctx.drawImage(img, 0, 0)
  return { w: img.width, h: img.height, data: ctx.getImageData(0, 0, img.width, img.height).data }
}
const files = readdirSync(a).filter((f) => f.endsWith('.png')).sort()
if (files.length < 18) throw new Error(`only ${files.length} examples rendered`)
let failed = 0
for (const f of files) {
  const [x, y] = [await pixels(join(a, f)), await pixels(join(b, f))]
  let diff = x.w === y.w && x.h === y.h ? 0 : -1
  if (diff === 0) for (let i = 0; i < x.data.length; i++) if (x.data[i] !== y.data[i]) diff++
  if (diff !== 0) {
    failed++
    console.error(`  DIFF ${f}: ${diff < 0 ? 'size differs' : diff + ' channel values differ'}`)
  }
}
console.log(`  ${files.length - failed}/${files.length} examples pixel-identical`)
if (failed) process.exit(1)
EOF
node compare.mjs "$WORK/out-node" "$WORK/out-bun"

echo "== OK: chartjs2img $VERSION works under Node $(node -v)"
