// The datalabels package ships types for its main entry but not for the deep
// ESM build path we import (to bind the same chart.js instance — see
// chart-registry.ts). Reuse the package's own default-export type.
declare module 'chartjs-plugin-datalabels/dist/chartjs-plugin-datalabels.esm.js' {
  import plugin from 'chartjs-plugin-datalabels'
  export default plugin
}
