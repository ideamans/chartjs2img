// Example chart *data* for the CLI's `examples` subcommand and the
// HTTP /examples gallery. HTML rendering lives in examples-gallery.ts.
//
// Every example `config` below MUST be JSON-serializable end to end.
// The render pipeline stringifies the chart config into a browser
// context via JSON.stringify, which silently drops function values,
// symbols, undefined, and class instances. If you add a new example
// using callback options (e.g. scale.ticks.callback, tooltip.callbacks,
// treemap labels.formatter), the function will vanish in transit and
// the example will render differently from its source — see P0-4 in
// REVIEW.md for the historical bug that motivated this comment.
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
    description: 'Using chartjs-chart-treemap plugin (values shown as labels)',
    // Chart configs MUST be JSON-serializable. Function values are
    // silently dropped by JSON.stringify and never reach the browser —
    // so we intentionally use `labels: { display: true }` and let the
    // treemap plugin format the node `v` value itself, instead of a
    // custom formatter function that would be stripped in transit.
    config: {
      type: 'treemap',
      data: {
        datasets: [
          {
            tree: [15, 6, 6, 5, 4, 3, 2, 2, 1],
            labels: {
              display: true,
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
  {
    title: 'Matrix Heatmap',
    description: '3×3 heatmap; one pre-computed color per cell (JSON has no callback)',
    config: {
      type: 'matrix',
      data: {
        datasets: [
          {
            label: 'Activity',
            data: [
              { x: 1, y: 1, v: 5 },
              { x: 2, y: 1, v: 15 },
              { x: 3, y: 1, v: 25 },
              { x: 1, y: 2, v: 10 },
              { x: 2, y: 2, v: 30 },
              { x: 3, y: 2, v: 20 },
              { x: 1, y: 3, v: 18 },
              { x: 2, y: 3, v: 8 },
              { x: 3, y: 3, v: 12 },
            ],
            backgroundColor: [
              'rgba(54,162,235,0.3)',
              'rgba(54,162,235,0.55)',
              'rgba(54,162,235,0.85)',
              'rgba(54,162,235,0.4)',
              'rgba(54,162,235,0.95)',
              'rgba(54,162,235,0.7)',
              'rgba(54,162,235,0.6)',
              'rgba(54,162,235,0.35)',
              'rgba(54,162,235,0.45)',
            ],
            borderColor: 'white',
            borderWidth: 2,
            width: 120,
            height: 120,
          },
        ],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          x: { type: 'linear', position: 'bottom', offset: true, ticks: { stepSize: 1 } },
          y: { type: 'linear', position: 'left', offset: true, ticks: { stepSize: 1 }, reverse: true },
        },
      },
    },
  },
  {
    title: 'Sankey Flow',
    description: 'Energy flow diagram with gradient-colored bands and label mapping',
    config: {
      type: 'sankey',
      data: {
        datasets: [
          {
            data: [
              { from: 'Oil', to: 'Fossil Fuels', flow: 15 },
              { from: 'Coal', to: 'Fossil Fuels', flow: 25 },
              { from: 'Gas', to: 'Fossil Fuels', flow: 20 },
              { from: 'Solar', to: 'Renewables', flow: 10 },
              { from: 'Wind', to: 'Renewables', flow: 8 },
              { from: 'Hydro', to: 'Renewables', flow: 12 },
              { from: 'Fossil Fuels', to: 'Electricity', flow: 35 },
              { from: 'Fossil Fuels', to: 'Transport', flow: 25 },
              { from: 'Renewables', to: 'Electricity', flow: 30 },
            ],
            colorFrom: '#36a2eb',
            colorTo: '#ff6384',
            colorMode: 'gradient',
            labels: {
              Oil: 'Crude Oil',
              Coal: 'Coal',
              Gas: 'Natural Gas',
              Solar: 'Solar PV',
              Wind: 'Wind',
              Hydro: 'Hydro',
              'Fossil Fuels': 'Fossil Fuels',
              Renewables: 'Renewables',
              Electricity: 'Grid',
              Transport: 'Vehicles',
            },
          },
        ],
      },
      options: { plugins: { legend: { display: false } } },
    },
  },
  {
    title: 'Word Cloud',
    description: 'Chart libraries sized by popularity; fixed rotation, per-word colors',
    config: {
      type: 'wordCloud',
      data: {
        labels: [
          'Chart.js',
          'D3',
          'Plotly',
          'Recharts',
          'Highcharts',
          'Vega',
          'ECharts',
          'ApexCharts',
          'Observable',
          'Tableau',
          'PowerBI',
          'Looker',
          'Superset',
          'Metabase',
        ],
        datasets: [
          {
            data: [90, 80, 60, 50, 45, 35, 70, 40, 55, 65, 50, 40, 45, 35],
            color: [
              '#36a2eb',
              '#ff6384',
              '#ffce56',
              '#4bc0c0',
              '#9966ff',
              '#ff9f40',
              '#c9cbcf',
              '#7bc8a4',
              '#5cb85c',
              '#f0ad4e',
              '#5bc0de',
              '#d9534f',
              '#337ab7',
              '#8e44ad',
            ],
          },
        ],
      },
      options: {
        elements: { word: { minRotation: 0, maxRotation: 0, padding: 4 } },
        plugins: { legend: { display: false } },
      },
    },
  },
  {
    title: 'Euler Diagram (3-set)',
    description: 'Proportional set overlaps — circle sizes reflect values',
    config: {
      type: 'euler',
      data: {
        labels: ['A', 'B', 'C', 'A ∩ B', 'A ∩ C', 'B ∩ C', 'A ∩ B ∩ C'],
        datasets: [
          {
            label: 'Three-set Euler',
            data: [
              { sets: ['A'], value: 12 },
              { sets: ['B'], value: 10 },
              { sets: ['C'], value: 8 },
              { sets: ['A', 'B'], value: 4 },
              { sets: ['A', 'C'], value: 3 },
              { sets: ['B', 'C'], value: 2 },
              { sets: ['A', 'B', 'C'], value: 1 },
            ],
            backgroundColor: [
              'rgba(54,162,235,0.5)',
              'rgba(255,99,132,0.5)',
              'rgba(255,206,86,0.5)',
            ],
            borderColor: [
              'rgba(54,162,235,1)',
              'rgba(255,99,132,1)',
              'rgba(255,206,86,1)',
            ],
          },
        ],
      },
    },
  },
  {
    title: 'Force-directed Graph',
    description: 'Microservice topology, physics-simulated layout',
    config: {
      type: 'forceDirectedGraph',
      data: {
        labels: ['Gateway', 'Auth', 'Users', 'Orders', 'Payments', 'Inventory', 'DB', 'Cache', 'Queue'],
        datasets: [
          {
            data: [{}, {}, {}, {}, {}, {}, {}, {}, {}],
            edges: [
              { source: 0, target: 1 },
              { source: 0, target: 2 },
              { source: 0, target: 3 },
              { source: 3, target: 4 },
              { source: 3, target: 5 },
              { source: 2, target: 6 },
              { source: 5, target: 6 },
              { source: 4, target: 7 },
              { source: 3, target: 8 },
              { source: 1, target: 7 },
            ],
            pointRadius: 12,
            pointBackgroundColor: '#36a2eb',
            pointBorderColor: '#1e5a8e',
            pointBorderWidth: 2,
          },
        ],
      },
      options: {
        plugins: { legend: { display: false } },
        simulation: {
          initialIterations: 100,
          forces: {
            link: { distance: 80 },
            manyBody: { strength: -300 },
            collide: { radius: 18, strength: 0.8 },
          },
        },
      },
    },
  },
  {
    title: 'Tidy Tree',
    description: '14-node org chart, horizontal orientation',
    config: {
      type: 'tree',
      data: {
        labels: [
          'CEO',
          'CTO',
          'COO',
          'CFO',
          'VP Eng',
          'VP Product',
          'Ops Dir',
          'Sales Dir',
          'FP&A',
          'Platform',
          'Frontend',
          'Mobile',
          'Design',
          'Research',
        ],
        datasets: [
          {
            data: [
              {},
              { parent: 0 },
              { parent: 0 },
              { parent: 0 },
              { parent: 1 },
              { parent: 1 },
              { parent: 2 },
              { parent: 2 },
              { parent: 3 },
              { parent: 4 },
              { parent: 4 },
              { parent: 4 },
              { parent: 5 },
              { parent: 5 },
            ],
            pointRadius: 6,
            pointBackgroundColor: '#36a2eb',
            pointBorderColor: '#1e5a8e',
            pointBorderWidth: 2,
          },
        ],
      },
      options: {
        plugins: { legend: { display: false } },
        tree: { orientation: 'horizontal' },
      },
    },
  },
  {
    title: 'Gradient Fill',
    description: 'Line with Y-axis scale-value gradient on fill + stroke',
    config: {
      type: 'line',
      data: {
        labels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
        datasets: [
          {
            label: 'Temperature',
            data: [5, 8, 12, 15, 20, 26, 30, 28, 24, 18, 12],
            fill: true,
            borderWidth: 2,
            tension: 0.35,
            gradient: {
              backgroundColor: {
                axis: 'y',
                colors: {
                  0: 'rgba(54, 162, 235, 0.0)',
                  15: 'rgba(54, 162, 235, 0.4)',
                  30: 'rgba(255, 99, 132, 0.6)',
                },
              },
              borderColor: {
                axis: 'y',
                colors: {
                  0: '#36a2eb',
                  15: '#ffce56',
                  30: '#ff6384',
                },
              },
            },
          },
        ],
      },
      options: { scales: { y: { beginAtZero: true } } },
    },
  },
  {
    title: 'Time Series (date-fns adapter)',
    description: 'ISO-date data points on a time scale; date-fns adapter bundled',
    config: {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'Daily sales',
            data: [
              { x: '2024-01-01', y: 100 },
              { x: '2024-01-02', y: 150 },
              { x: '2024-01-03', y: 120 },
              { x: '2024-01-04', y: 200 },
              { x: '2024-01-05', y: 180 },
              { x: '2024-01-08', y: 230 },
              { x: '2024-01-09', y: 210 },
              { x: '2024-01-10', y: 260 },
            ],
            borderColor: '#36a2eb',
            backgroundColor: 'rgba(54, 162, 235, 0.15)',
            fill: true,
            tension: 0.3,
          },
        ],
      },
      options: {
        plugins: { legend: { position: 'top' } },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'day',
              displayFormats: { day: 'MMM d' },
              tooltipFormat: 'yyyy-MM-dd',
            },
            title: { display: true, text: 'Date' },
          },
          y: { beginAtZero: true },
        },
      },
    },
  },
  {
    title: 'Annotation: Box + Point',
    description: 'Launch-window box + peak-signup point overlaid on a line',
    config: {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          {
            label: 'Signups',
            data: [120, 180, 220, 310, 290, 410],
            borderColor: '#36a2eb',
            tension: 0.3,
          },
        ],
      },
      options: {
        plugins: {
          annotation: {
            annotations: {
              launchWindow: {
                type: 'box',
                xMin: 2,
                xMax: 3,
                backgroundColor: 'rgba(255, 206, 86, 0.15)',
                borderColor: 'rgba(255, 206, 86, 0.8)',
                borderWidth: 1,
                label: {
                  display: true,
                  content: 'Launch',
                  position: { x: 'center', y: 'start' },
                },
              },
              peak: {
                type: 'point',
                xValue: 5,
                yValue: 410,
                radius: 8,
                backgroundColor: 'rgba(255, 99, 132, 0.8)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 2,
              },
            },
          },
        },
      },
    },
  },
  // --- Option showcases: axis customization, multiple axes, log scale, etc.
  {
    title: 'Dual Axis (Sales vs Conversion Rate)',
    description: 'Bar + line with two Y axes — sales in USD on the left, conversion % on the right. Uses yAxisID per dataset and position: "right" on the second scale.',
    config: {
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          {
            type: 'bar',
            label: 'Sales ($K)',
            data: [120, 180, 150, 220, 190, 260],
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            yAxisID: 'ySales',
            order: 2,
          },
          {
            type: 'line',
            label: 'Conversion rate (%)',
            data: [3.2, 4.1, 3.8, 5.0, 4.6, 5.4],
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.1)',
            tension: 0.3,
            yAxisID: 'yRate',
            order: 1,
          },
        ],
      },
      options: {
        plugins: {
          title: { display: true, text: 'Q2 Sales vs Conversion Rate' },
          legend: { position: 'top' },
        },
        scales: {
          ySales: {
            type: 'linear',
            position: 'left',
            title: { display: true, text: 'Sales ($K)' },
            beginAtZero: true,
            grid: { color: 'rgba(54, 162, 235, 0.1)' },
          },
          yRate: {
            type: 'linear',
            position: 'right',
            title: { display: true, text: 'Conversion (%)' },
            beginAtZero: true,
            suggestedMax: 8,
            grid: { drawOnChartArea: false },
            ticks: { callback: undefined }, // placeholder; handled by default numeric
          },
          x: {
            grid: { display: false },
          },
        },
      },
    },
  },
  {
    title: 'Log Scale (Download growth)',
    description: 'Logarithmic Y axis exposes exponential growth the linear scale would flatten. Uses scales.y.type: "logarithmic".',
    config: {
      type: 'line',
      data: {
        labels: ['2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'],
        datasets: [
          {
            label: 'Downloads',
            data: [1200, 4500, 18000, 72000, 260000, 910000, 2_400_000, 6_200_000],
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            fill: true,
            tension: 0.2,
          },
        ],
      },
      options: {
        plugins: {
          title: { display: true, text: 'Monthly downloads (log Y)' },
          legend: { display: false },
        },
        scales: {
          y: {
            type: 'logarithmic',
            title: { display: true, text: 'Downloads (log scale)' },
            grid: { color: 'rgba(0,0,0,0.06)' },
          },
          x: {
            title: { display: true, text: 'Year' },
          },
        },
      },
    },
  },
  {
    title: 'Negative Values (Profit & Loss)',
    description: 'Bar chart spanning positive and negative Y, with a zero baseline, min/max clipping, and diverging colors. Uses per-bar backgroundColor derived from the data sign.',
    config: {
      type: 'bar',
      data: {
        labels: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6'],
        datasets: [
          {
            label: 'Net profit ($M)',
            data: [12, -4, 18, -9, 22, 6],
            backgroundColor: [
              'rgba(75, 192, 192, 0.75)',
              'rgba(255, 99, 132, 0.75)',
              'rgba(75, 192, 192, 0.75)',
              'rgba(255, 99, 132, 0.75)',
              'rgba(75, 192, 192, 0.75)',
              'rgba(75, 192, 192, 0.75)',
            ],
            borderColor: [
              'rgb(75, 192, 192)',
              'rgb(255, 99, 132)',
              'rgb(75, 192, 192)',
              'rgb(255, 99, 132)',
              'rgb(75, 192, 192)',
              'rgb(75, 192, 192)',
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        plugins: {
          title: { display: true, text: 'Quarterly P&L' },
          legend: { display: false },
        },
        scales: {
          y: {
            suggestedMin: -15,
            suggestedMax: 25,
            title: { display: true, text: 'USD (millions)' },
            grid: {
              color: 'rgba(0,0,0,0.06)',
            },
            border: {
              color: 'rgba(0,0,0,0.4)',
            },
          },
          x: {
            grid: { display: false },
            border: { color: 'rgba(0,0,0,0.4)' },
          },
        },
      },
    },
  },
  {
    title: 'Rotated Tick Labels',
    description: 'Long category labels rotated 40° so nothing overlaps. Demonstrates ticks.maxRotation / minRotation and autoSkip: false.',
    config: {
      type: 'bar',
      data: {
        labels: [
          'North America',
          'South America',
          'Europe (West)',
          'Europe (East)',
          'Asia Pacific',
          'Middle East & Africa',
          'Central Asia',
          'Oceania',
        ],
        datasets: [
          {
            label: 'Active users (M)',
            data: [42, 18, 35, 22, 58, 14, 9, 7],
            backgroundColor: 'rgba(153, 102, 255, 0.7)',
          },
        ],
      },
      options: {
        plugins: {
          title: { display: true, text: 'Active users by region' },
          legend: { display: false },
        },
        scales: {
          x: {
            ticks: {
              maxRotation: 40,
              minRotation: 40,
              autoSkip: false,
            },
            grid: { display: false },
          },
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Users (millions)' },
          },
        },
      },
    },
  },
  {
    title: 'Custom Grid & Tick Styling',
    description: 'Dashed minor grid, colored Y-axis ticks at specific breakpoints, hidden X grid, branded colors throughout. Demonstrates scales.*.grid, .ticks, and .border customization.',
    config: {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'CPU usage (%)',
            data: [42, 58, 71, 48, 82, 35, 29],
            borderColor: '#0ea5e9',
            backgroundColor: 'rgba(14, 165, 233, 0.12)',
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#0ea5e9',
            pointRadius: 5,
          },
        ],
      },
      options: {
        plugins: {
          title: { display: true, text: 'Daily CPU usage — custom axes' },
          legend: { display: false },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { color: '#94a3b8' },
            ticks: { color: '#64748b', font: { weight: 'bold' } },
          },
          y: {
            min: 0,
            max: 100,
            grid: {
              color: 'rgba(100, 116, 139, 0.12)',
              tickBorderDash: [4, 4],
            },
            border: { color: '#94a3b8' },
            ticks: {
              color: '#64748b',
              stepSize: 25,
            },
            title: { display: true, text: 'CPU %', color: '#334155' },
          },
        },
      },
    },
  },
  {
    title: 'Showcase: Revenue with Forecast',
    description: 'Time-series line with a highlighted forecast window, peak-point annotation, threshold line, and on-point data labels — gradient, annotation, datalabels, and the date-fns adapter working together.',
    config: {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'Monthly revenue ($K)',
            data: [
              { x: '2024-01-01', y: 120 },
              { x: '2024-02-01', y: 140 },
              { x: '2024-03-01', y: 165 },
              { x: '2024-04-01', y: 180 },
              { x: '2024-05-01', y: 220 },
              { x: '2024-06-01', y: 260 },
              { x: '2024-07-01', y: 310 },
              { x: '2024-08-01', y: 295 },
              { x: '2024-09-01', y: 340 },
              { x: '2024-10-01', y: 385 },
              { x: '2024-11-01', y: 410 },
              { x: '2024-12-01', y: 460 },
            ],
            borderColor: '#0ea5e9',
            backgroundColor: 'rgba(14, 165, 233, 0.15)',
            fill: true,
            tension: 0.3,
            pointBackgroundColor: '#0ea5e9',
            pointRadius: 4,
            gradient: {
              borderColor: {
                axis: 'y',
                colors: { 100: '#0ea5e9', 300: '#6366f1', 500: '#ec4899' },
              },
            },
          },
        ],
      },
      options: {
        plugins: {
          title: { display: true, text: 'FY24 revenue with forecast window' },
          legend: { position: 'top' },
          datalabels: {
            display: true,
            align: 'top',
            anchor: 'end',
            color: '#334155',
            font: { size: 10, weight: 'bold' },
            offset: 4,
          },
          annotation: {
            annotations: {
              forecastBand: {
                type: 'box',
                xMin: '2024-10-01',
                xMax: '2024-12-01',
                backgroundColor: 'rgba(236, 72, 153, 0.08)',
                borderColor: 'rgba(236, 72, 153, 0.35)',
                borderWidth: 1,
                borderDash: [6, 4],
                label: {
                  display: true,
                  content: 'Forecast window',
                  position: { x: 'center', y: 'start' },
                  color: '#be185d',
                  font: { weight: 'bold' },
                  backgroundColor: 'rgba(255,255,255,0.85)',
                },
              },
              goal: {
                type: 'line',
                yMin: 400,
                yMax: 400,
                borderColor: '#10b981',
                borderWidth: 2,
                borderDash: [4, 4],
                label: {
                  display: true,
                  content: 'Goal: 400',
                  position: 'start',
                  color: '#065f46',
                  backgroundColor: 'rgba(255,255,255,0.85)',
                },
              },
              peak: {
                type: 'point',
                xValue: '2024-12-01',
                yValue: 460,
                radius: 8,
                backgroundColor: 'rgba(236, 72, 153, 0.85)',
                borderColor: '#ffffff',
                borderWidth: 2,
              },
            },
          },
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'month',
              displayFormats: { month: 'MMM' },
              tooltipFormat: 'yyyy-MM-dd',
            },
            grid: { display: false },
          },
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Revenue ($K)' },
            grid: { color: 'rgba(0,0,0,0.06)' },
          },
        },
      },
    },
    width: 900,
    height: 500,
  },
  {
    title: 'Showcase: Ops Dashboard',
    description: 'Stacked-bar backlog + overlay line of SLA breach rate, secondary Y axis, threshold annotation, datalabels on the line — a microservices "snapshot" combining stacked bars, annotation, datalabels, and dual axes.',
    config: {
      type: 'bar',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            type: 'bar',
            label: 'Critical',
            data: [4, 6, 9, 12, 7, 2, 1],
            backgroundColor: 'rgba(239, 68, 68, 0.75)',
            stack: 'tickets',
            yAxisID: 'yCount',
            order: 3,
          },
          {
            type: 'bar',
            label: 'Major',
            data: [8, 14, 12, 18, 16, 6, 4],
            backgroundColor: 'rgba(249, 115, 22, 0.75)',
            stack: 'tickets',
            yAxisID: 'yCount',
            order: 3,
          },
          {
            type: 'bar',
            label: 'Minor',
            data: [16, 20, 22, 25, 24, 14, 10],
            backgroundColor: 'rgba(250, 204, 21, 0.75)',
            stack: 'tickets',
            yAxisID: 'yCount',
            order: 3,
          },
          {
            type: 'line',
            label: 'SLA breach rate (%)',
            data: [4.2, 5.8, 7.1, 9.8, 8.0, 3.2, 2.1],
            borderColor: '#1e3a5f',
            backgroundColor: 'rgba(30, 58, 95, 0.08)',
            tension: 0.3,
            fill: false,
            yAxisID: 'yRate',
            order: 1,
            pointBackgroundColor: '#1e3a5f',
            pointRadius: 5,
            datalabels: {
              display: true,
              align: 'top',
              anchor: 'end',
              color: '#1e3a5f',
              font: { size: 10, weight: 'bold' },
              formatter: undefined,
              offset: 6,
            },
          },
        ],
      },
      options: {
        plugins: {
          title: { display: true, text: 'Weekly operations — tickets & SLA' },
          legend: { position: 'top' },
          datalabels: { display: false },
          annotation: {
            annotations: {
              slaLimit: {
                type: 'line',
                yMin: 5,
                yMax: 5,
                yScaleID: 'yRate',
                borderColor: '#dc2626',
                borderWidth: 2,
                borderDash: [5, 5],
                label: {
                  display: true,
                  content: 'SLA limit: 5%',
                  position: 'end',
                  color: '#991b1b',
                  backgroundColor: 'rgba(255,255,255,0.85)',
                },
              },
              peakLoad: {
                type: 'box',
                xMin: 2.5,
                xMax: 4.5,
                backgroundColor: 'rgba(249, 115, 22, 0.08)',
                borderColor: 'rgba(249, 115, 22, 0.3)',
                borderWidth: 1,
                label: {
                  display: true,
                  content: 'Peak load',
                  position: { x: 'center', y: 'start' },
                  color: '#9a3412',
                  backgroundColor: 'rgba(255,255,255,0.85)',
                  font: { weight: 'bold' },
                },
              },
            },
          },
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
          },
          yCount: {
            type: 'linear',
            stacked: true,
            position: 'left',
            beginAtZero: true,
            title: { display: true, text: 'Tickets' },
            grid: { color: 'rgba(0,0,0,0.06)' },
          },
          yRate: {
            type: 'linear',
            position: 'right',
            beginAtZero: true,
            suggestedMax: 12,
            title: { display: true, text: 'Breach rate (%)' },
            grid: { drawOnChartArea: false },
          },
        },
      },
    },
    width: 900,
    height: 500,
  },
]

