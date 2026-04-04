// Gallery / Examples page served at /examples
import { LIBS } from './template'

const LIBS_INFO = Object.fromEntries(Object.entries(LIBS).map(([k, v]) => [k, v.version]))

export interface ExampleChart {
  title: string
  description: string
  config: Record<string, unknown>
  width?: number
  height?: number
}

export const EXAMPLES: ExampleChart[] = [
  {
    title: 'Bar Chart',
    description: 'Basic vertical bar chart with multiple colors',
    config: {
      type: 'bar',
      data: {
        labels: ['January', 'February', 'March', 'April', 'May', 'June'],
        datasets: [
          {
            label: 'Revenue ($K)',
            data: [12, 19, 3, 5, 2, 15],
            backgroundColor: [
              'rgba(255, 99, 132, 0.7)',
              'rgba(54, 162, 235, 0.7)',
              'rgba(255, 206, 86, 0.7)',
              'rgba(75, 192, 192, 0.7)',
              'rgba(153, 102, 255, 0.7)',
              'rgba(255, 159, 64, 0.7)',
            ],
          },
        ],
      },
    },
  },
  {
    title: 'Horizontal Bar Chart',
    description: 'Bar chart with horizontal orientation',
    config: {
      type: 'bar',
      data: {
        labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple'],
        datasets: [{ label: 'Votes', data: [12, 19, 3, 5, 2], backgroundColor: 'rgba(54,162,235,0.7)' }],
      },
      options: { indexAxis: 'y' },
    },
  },
  {
    title: 'Line Chart',
    description: 'Multi-dataset line chart with tension',
    config: {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          { label: 'This Week', data: [65, 59, 80, 81, 56, 55, 72], borderColor: 'rgb(75,192,192)', tension: 0.3 },
          {
            label: 'Last Week',
            data: [28, 48, 40, 19, 86, 27, 90],
            borderColor: 'rgb(255,99,132)',
            tension: 0.3,
          },
        ],
      },
    },
  },
  {
    title: 'Area Chart (Filled)',
    description: 'Line chart with fill between datasets',
    config: {
      type: 'line',
      data: {
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        datasets: [
          {
            label: '2024',
            data: [100, 150, 180, 220],
            borderColor: 'rgb(54,162,235)',
            backgroundColor: 'rgba(54,162,235,0.3)',
            fill: true,
          },
          {
            label: '2025',
            data: [80, 120, 200, 250],
            borderColor: 'rgb(255,99,132)',
            backgroundColor: 'rgba(255,99,132,0.3)',
            fill: true,
          },
        ],
      },
    },
  },
  {
    title: 'Pie Chart',
    description: 'Basic pie chart',
    config: {
      type: 'pie',
      data: {
        labels: ['Desktop', 'Mobile', 'Tablet'],
        datasets: [
          {
            data: [55, 35, 10],
            backgroundColor: ['rgba(255,99,132,0.8)', 'rgba(54,162,235,0.8)', 'rgba(255,206,86,0.8)'],
          },
        ],
      },
    },
    width: 500,
    height: 500,
  },
  {
    title: 'Doughnut Chart',
    description: 'Doughnut chart with custom cutout',
    config: {
      type: 'doughnut',
      data: {
        labels: ['Completed', 'In Progress', 'Not Started'],
        datasets: [
          {
            data: [60, 25, 15],
            backgroundColor: ['rgba(75,192,192,0.8)', 'rgba(255,206,86,0.8)', 'rgba(201,203,207,0.8)'],
          },
        ],
      },
      options: { cutout: '60%' },
    },
    width: 500,
    height: 500,
  },
  {
    title: 'Radar Chart',
    description: 'Radar chart comparing two datasets',
    config: {
      type: 'radar',
      data: {
        labels: ['Speed', 'Reliability', 'Comfort', 'Safety', 'Efficiency', 'Cost'],
        datasets: [
          {
            label: 'Car A',
            data: [65, 59, 90, 81, 56, 55],
            borderColor: 'rgb(255,99,132)',
            backgroundColor: 'rgba(255,99,132,0.2)',
          },
          {
            label: 'Car B',
            data: [28, 48, 40, 19, 96, 87],
            borderColor: 'rgb(54,162,235)',
            backgroundColor: 'rgba(54,162,235,0.2)',
          },
        ],
      },
    },
    width: 500,
    height: 500,
  },
  {
    title: 'Polar Area Chart',
    description: 'Polar area with varied radii',
    config: {
      type: 'polarArea',
      data: {
        labels: ['Red', 'Green', 'Yellow', 'Grey', 'Blue'],
        datasets: [
          {
            data: [11, 16, 7, 3, 14],
            backgroundColor: [
              'rgba(255,99,132,0.7)',
              'rgba(75,192,192,0.7)',
              'rgba(255,205,86,0.7)',
              'rgba(201,203,207,0.7)',
              'rgba(54,162,235,0.7)',
            ],
          },
        ],
      },
    },
    width: 500,
    height: 500,
  },
  {
    title: 'Scatter Plot',
    description: 'Scatter chart with point sizes',
    config: {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: 'Dataset A',
            data: [
              { x: -10, y: 0 },
              { x: 0, y: 10 },
              { x: 10, y: 5 },
              { x: 5, y: 15 },
              { x: -5, y: 8 },
            ],
            backgroundColor: 'rgba(255,99,132,0.7)',
            pointRadius: 6,
          },
          {
            label: 'Dataset B',
            data: [
              { x: -8, y: 12 },
              { x: 3, y: 3 },
              { x: 8, y: 8 },
              { x: -3, y: -2 },
              { x: 12, y: 1 },
            ],
            backgroundColor: 'rgba(54,162,235,0.7)',
            pointRadius: 6,
          },
        ],
      },
    },
  },
  {
    title: 'Bubble Chart',
    description: 'Bubble chart with varying radii',
    config: {
      type: 'bubble',
      data: {
        datasets: [
          {
            label: 'Sales',
            data: [
              { x: 20, y: 30, r: 15 },
              { x: 40, y: 10, r: 10 },
              { x: 15, y: 25, r: 20 },
              { x: 35, y: 35, r: 8 },
            ],
            backgroundColor: 'rgba(255,99,132,0.6)',
          },
          {
            label: 'Marketing',
            data: [
              { x: 25, y: 15, r: 12 },
              { x: 10, y: 40, r: 18 },
              { x: 30, y: 20, r: 7 },
            ],
            backgroundColor: 'rgba(54,162,235,0.6)',
          },
        ],
      },
    },
  },
  {
    title: 'Mixed Chart (Bar + Line)',
    description: 'Combined bar and line chart',
    config: {
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          { type: 'bar', label: 'Sales', data: [10, 20, 15, 25, 22, 30], backgroundColor: 'rgba(54,162,235,0.7)' },
          {
            type: 'line',
            label: 'Trend',
            data: [12, 18, 16, 23, 21, 28],
            borderColor: 'rgb(255,99,132)',
            tension: 0.4,
            fill: false,
          },
        ],
      },
    },
  },
  {
    title: 'Stacked Bar Chart',
    description: 'Stacked bars with three datasets',
    config: {
      type: 'bar',
      data: {
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        datasets: [
          { label: 'Product A', data: [50, 60, 70, 80], backgroundColor: 'rgba(255,99,132,0.7)' },
          { label: 'Product B', data: [30, 40, 45, 55], backgroundColor: 'rgba(54,162,235,0.7)' },
          { label: 'Product C', data: [20, 15, 25, 30], backgroundColor: 'rgba(255,206,86,0.7)' },
        ],
      },
      options: { scales: { x: { stacked: true }, y: { stacked: true } } },
    },
  },
  {
    title: 'Bar with Data Labels',
    description: 'Using chartjs-plugin-datalabels to show values on bars',
    config: {
      type: 'bar',
      data: {
        labels: ['A', 'B', 'C', 'D', 'E'],
        datasets: [{ label: 'Score', data: [85, 72, 93, 68, 88], backgroundColor: 'rgba(75,192,192,0.7)' }],
      },
      options: {
        plugins: {
          datalabels: {
            display: true,
            color: '#333',
            font: { weight: 'bold', size: 14 },
            anchor: 'end',
            align: 'top',
          },
        },
      },
    },
  },
  {
    title: 'Line with Annotation',
    description: 'Using chartjs-plugin-annotation to add a threshold line',
    config: {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          { label: 'Performance', data: [65, 59, 80, 81, 56, 72], borderColor: 'rgb(75,192,192)', tension: 0.2 },
        ],
      },
      options: {
        plugins: {
          annotation: {
            annotations: {
              threshold: {
                type: 'line',
                yMin: 70,
                yMax: 70,
                borderColor: 'rgb(255,99,132)',
                borderWidth: 2,
                borderDash: [5, 5],
                label: { display: true, content: 'Target: 70', position: 'start' },
              },
            },
          },
        },
      },
    },
  },
  {
    title: 'Treemap Chart',
    description: 'Using chartjs-chart-treemap plugin',
    config: {
      type: 'treemap',
      data: {
        datasets: [
          {
            tree: [15, 6, 6, 5, 4, 3, 2, 2, 1],
            labels: {
              display: true,
              formatter: (ctx: unknown) => `Item ${(ctx as { dataIndex: number }).dataIndex + 1}`,
            },
            backgroundColor: [
              'rgba(255,99,132,0.7)',
              'rgba(54,162,235,0.7)',
              'rgba(255,206,86,0.7)',
              'rgba(75,192,192,0.7)',
              'rgba(153,102,255,0.7)',
              'rgba(255,159,64,0.7)',
              'rgba(201,203,207,0.7)',
              'rgba(100,181,246,0.7)',
              'rgba(174,213,129,0.7)',
            ],
          },
        ],
      },
    },
  },
  {
    title: 'Small Size (400x300)',
    description: 'Smaller chart for email or thumbnail use',
    config: {
      type: 'bar',
      data: {
        labels: ['A', 'B', 'C'],
        datasets: [{ label: 'Data', data: [10, 20, 15], backgroundColor: 'rgba(153,102,255,0.7)' }],
      },
    },
    width: 400,
    height: 300,
  },
  {
    title: 'Wide Chart (1200x400)',
    description: 'Wide format for dashboards or reports',
    config: {
      type: 'line',
      data: {
        labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
        datasets: [
          {
            label: 'Requests/min',
            data: [12, 8, 5, 3, 2, 4, 15, 45, 80, 95, 88, 92, 85, 78, 82, 90, 95, 70, 45, 30, 25, 20, 18, 14],
            borderColor: 'rgb(75,192,192)',
            backgroundColor: 'rgba(75,192,192,0.2)',
            fill: true,
            tension: 0.4,
          },
        ],
      },
    },
    width: 1200,
    height: 400,
  },
  {
    title: 'Japanese Labels (日本語テスト)',
    description: 'Test with Japanese text to verify Noto Sans JP rendering',
    config: {
      type: 'bar',
      data: {
        labels: ['東京', '大阪', '名古屋', '福岡', '札幌'],
        datasets: [
          { label: '売上高（百万円）', data: [120, 85, 60, 45, 30], backgroundColor: 'rgba(255,99,132,0.7)' },
        ],
      },
      options: {
        plugins: {
          title: { display: true, text: '地域別売上高レポート', font: { size: 16 } },
          datalabels: { display: true, color: '#333', font: { weight: 'bold' }, anchor: 'end', align: 'top' },
        },
      },
    },
  },
]

export function buildExamplesHtml(baseUrl: string, apiKey?: string, version?: string): string {
  const examplesJson = JSON.stringify(EXAMPLES)

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
const BASE = ${JSON.stringify(baseUrl)};
const API_KEY = ${JSON.stringify(apiKey ?? '')};
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
