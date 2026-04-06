// HTML template that loads Chart.js + plugins and renders a chart
// Chart.js and plugins are loaded from CDN inside the Playwright browser context

const CDN = 'https://cdn.jsdelivr.net/npm'

export const LIBS = {
  chartjs: { pkg: 'chart.js', version: '4.4.9', file: 'dist/chart.umd.min.js' },
  // Plugins
  datalabels: { pkg: 'chartjs-plugin-datalabels', version: '2.2.0', file: 'dist/chartjs-plugin-datalabels.min.js' },
  annotation: { pkg: 'chartjs-plugin-annotation', version: '3.1.0', file: 'dist/chartjs-plugin-annotation.min.js' },
  zoom: { pkg: 'chartjs-plugin-zoom', version: '2.2.0', file: 'dist/chartjs-plugin-zoom.min.js' },
  gradient: { pkg: 'chartjs-plugin-gradient', version: '0.6.1', file: 'dist/chartjs-plugin-gradient.min.js' },
  // Additional chart types
  matrix: { pkg: 'chartjs-chart-matrix', version: '2.0.1', file: 'dist/chartjs-chart-matrix.min.js' },
  sankey: { pkg: 'chartjs-chart-sankey', version: '0.12.1', file: 'dist/chartjs-chart-sankey.min.js' },
  treemap: { pkg: 'chartjs-chart-treemap', version: '2.3.1', file: 'dist/chartjs-chart-treemap.min.js' },
  wordcloud: { pkg: 'chartjs-chart-wordcloud', version: '4.4.3', file: 'dist/chartjs-chart-wordcloud.min.js' },
  geo: { pkg: 'chartjs-chart-geo', version: '4.3.3', file: 'dist/chartjs-chart-geo.min.js' },
  graph: { pkg: 'chartjs-chart-graph', version: '4.3.3', file: 'dist/chartjs-chart-graph.min.js' },
  venn: { pkg: 'chartjs-chart-venn', version: '4.3.3', file: 'dist/chartjs-chart-venn.min.js' },
  // Date adapter
  adapterDayjs: { pkg: 'chartjs-adapter-dayjs-4', version: '1.0.4', file: 'dist/chartjs-adapter-dayjs-4.bundle.min.js' },
} as const

function cdnUrl(lib: (typeof LIBS)[keyof typeof LIBS]): string {
  return `${CDN}/${lib.pkg}@${lib.version}/${lib.file}`
}

export interface RenderOptions {
  /** Chart.js configuration object */
  chart: Record<string, unknown>
  /** Canvas width in pixels (default: 800) */
  width?: number
  /** Canvas height in pixels (default: 600) */
  height?: number
  /** Device pixel ratio (default: 2) */
  devicePixelRatio?: number
  /** Background color (default: 'white') */
  backgroundColor?: string
  /** Output format: png, jpeg, webp (default: 'png') */
  format?: 'png' | 'jpeg' | 'webp'
  /** JPEG/WebP quality 0-100 (default: 90) */
  quality?: number
}

export function buildHtml(options: RenderOptions): string {
  const {
    chart,
    width = 800,
    height = 600,
    devicePixelRatio = 2,
    backgroundColor = 'white',
  } = options

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; }
  body { background: ${backgroundColor}; }
  #chart-container {
    width: ${width}px;
    height: ${height}px;
  }
</style>
${Object.values(LIBS)
      .map((lib) => `<script src="${cdnUrl(lib)}"></script>`)
      .join('\n')}
</head>
<body>
<div id="chart-container">
  <canvas id="chart"></canvas>
</div>
<script>
(function() {
  var config = ${JSON.stringify(chart)};

  // Set device pixel ratio
  config.options = config.options || {};
  config.options.devicePixelRatio = ${devicePixelRatio};

  // Set responsive
  config.options.responsive = true;
  config.options.maintainAspectRatio = false;

  // Register plugins that don't auto-register
  if (window.ChartDataLabels) Chart.register(ChartDataLabels);
  if (window.ChartGeo) {
    Object.values(ChartGeo).forEach(function(v) {
      if (v && v.id) Chart.register(v);
    });
  }

  // Force all animations off for instant rendering
  config.options.animation = false;
  config.options.animations = { colors: false, x: false, y: false };
  config.options.transitions = {
    active: { animation: { duration: 0 } },
    resize: { animation: { duration: 0 } },
    show: { animation: { duration: 0 } },
    hide: { animation: { duration: 0 } },
  };

  // Collect console messages for caller feedback
  window.__chartMessages = [];
  var origWarn = console.warn;
  var origError = console.error;
  console.warn = function() {
    var msg = Array.prototype.slice.call(arguments).join(' ');
    window.__chartMessages.push({ level: 'warn', message: msg });
    origWarn.apply(console, arguments);
  };
  console.error = function() {
    var msg = Array.prototype.slice.call(arguments).join(' ');
    window.__chartMessages.push({ level: 'error', message: msg });
    origError.apply(console, arguments);
  };

  var canvas = document.getElementById('chart');
  var ctx = canvas.getContext('2d');
  try {
    var myChart = new Chart(ctx, config);
  } catch (e) {
    window.__chartMessages.push({ level: 'error', message: e.message || String(e) });
    window.__chartError = e.message || String(e);
  }

  // Signal that chart is ready (even on error, so we don't timeout)
  window.__chartRendered = true;
})();
</script>
</body>
</html>`
}
