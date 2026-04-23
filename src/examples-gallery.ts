// Gallery HTML generator for GET /examples.
//
// Split out from src/examples.ts so that file contains only the
// example chart *data*. Keeping a 100+ line HTML/JS template string
// next to 800 lines of chart config was two responsibilities in one
// module — edits to either side risked unrelated churn in the other.
import { EXAMPLES } from './examples'
import { LIBS } from './template'

const LIBS_INFO = Object.fromEntries(Object.entries(LIBS).map(([k, v]) => [k, v.version]))

/**
 * Serialize a value for embedding inside an HTML <script> tag.
 *
 * JSON.stringify escapes JSON string delimiters (") but not HTML tag
 * delimiters. A string containing `</script>` would close the enclosing
 * script block when parsed as HTML, letting an attacker break out of
 * the JS string literal and inject new markup. That matters here
 * because `baseUrl` is derived from the request's Host header and
 * `apiKey` is operator-controlled — neither is assumed sanitized for
 * HTML context.
 *
 * Escape `<` to the unicode form `<`; it still parses as `<` inside
 * a JS string but the HTML tokenizer never sees the literal character
 * so it can't match `</script>` or any other end-tag pattern.
 */
function jsEmbed(v: unknown): string {
  return JSON.stringify(v).replace(/</g, '\\u003c')
}

export function buildExamplesHtml(baseUrl: string, apiKey?: string, version?: string): string {
  const examplesJson = jsEmbed(EXAMPLES)

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>chartjs2img - Examples Gallery</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css">
<style>
  :root { --pico-font-size: 16px; }
  body { padding: 1rem; }
  .grid-gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(500px, 1fr)); gap: 1.5rem; }
  .card { border: 1px solid var(--pico-muted-border-color); border-radius: 8px; overflow: hidden; }
  .card img { width: 100%; display: block; background: #f5f5f5; min-height: 200px; }
  .card-body { padding: 1rem; }
  .card-body h3 { margin: 0 0 0.25rem 0; font-size: 1.1rem; }
  .card-body p { margin: 0 0 0.5rem 0; color: var(--pico-muted-color); font-size: 0.9rem; }
  details { margin-top: 0.5rem; }
  details pre { max-height: 300px; overflow: auto; font-size: 0.8rem; }
  .badge { display: inline-block; font-size: 0.75rem; padding: 0.15em 0.5em; border-radius: 4px; background: var(--pico-primary-background); color: var(--pico-primary-inverse); }
  .stats { font-size: 0.85rem; color: var(--pico-muted-color); }
  header { margin-bottom: 2rem; }
  .loading { opacity: 0.5; }
</style>
</head>
<body>
<header>
  <h1>chartjs2img Examples</h1>
  <p>Each image below is rendered server-side via Playwright. Click "Show JSON" to see the Chart.js configuration used.</p>
  <p class="stats" id="stats">Loading...</p>
</header>
<main class="grid-gallery" id="gallery"></main>
<script>
const BASE = ${jsEmbed(baseUrl)};
const API_KEY = ${jsEmbed(apiKey ?? '')};
const EXAMPLES = ${examplesJson};

const headers = { 'Content-Type': 'application/json' };
if (API_KEY) headers['X-API-Key'] = API_KEY;

async function renderExample(ex, card) {
  const body = {
    chart: ex.config,
    width: ex.width || 800,
    height: ex.height || 600,
  };

  try {
    const resp = await fetch(BASE + '/render', { method: 'POST', headers, body: JSON.stringify(body) });
    if (!resp.ok) throw new Error(await resp.text());

    const cacheUrl = resp.headers.get('X-Cache-Url');
    const cached = resp.headers.get('X-Cache-Hit');
    const blob = await resp.blob();
    const img = card.querySelector('img');
    img.src = URL.createObjectURL(blob);
    img.classList.remove('loading');

    // Update cache badge
    const badge = card.querySelector('.cache-badge');
    if (cacheUrl) {
      badge.innerHTML = '<a href="' + cacheUrl + '" target="_blank" class="badge">Cache: ' + cacheUrl.split('/').pop() + '</a>';
      if (cached === 'true') badge.innerHTML += ' <span class="badge" style="background:#4caf50">HIT</span>';
    }
  } catch (err) {
    const img = card.querySelector('img');
    img.alt = 'Error: ' + err.message;
    img.style.minHeight = '60px';
    img.classList.remove('loading');
  }
}

async function loadStats() {
  try {
    const resp = await fetch(BASE + '/health', { headers: API_KEY ? { 'X-API-Key': API_KEY } : {} });
    const data = await resp.json();
    document.getElementById('stats').textContent =
      'Browser: ' + (data.renderer?.browserConnected ? 'connected' : 'disconnected') +
      ' | Concurrency: ' + (data.renderer?.concurrency?.active || 0) + '/' + (data.renderer?.concurrency?.max || '?') +
      ' | Cache: ' + (data.cache?.size || 0) + ' entries';
  } catch {}
}

function init() {
  const gallery = document.getElementById('gallery');

  EXAMPLES.forEach((ex, i) => {
    const card = document.createElement('div');
    card.className = 'card';
    const dims = (ex.width || 800) + 'x' + (ex.height || 600);
    card.innerHTML =
      '<img class="loading" alt="Loading ' + ex.title + '...">' +
      '<div class="card-body">' +
        '<h3>' + ex.title + '</h3>' +
        '<p>' + ex.description + ' <small>(' + dims + ')</small></p>' +
        '<span class="cache-badge"></span>' +
        '<details><summary>Show JSON</summary><pre><code>' +
          JSON.stringify(ex.config, null, 2) +
        '</code></pre></details>' +
      '</div>';
    gallery.appendChild(card);
    renderExample(ex, card);
  });

  setTimeout(loadStats, 2000);
}

init();
</script>
<footer style="margin-top:2rem;padding:1rem 0;text-align:center;font-size:0.85rem;color:var(--pico-muted-color);border-top:1px solid var(--pico-muted-border-color);">
  chartjs2img v${version ?? 'dev'} &mdash; Chart.js ${LIBS_INFO.chartjs} + Playwright
</footer>
</body>
</html>`
}
