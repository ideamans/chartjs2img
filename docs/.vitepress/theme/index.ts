import Theme from 'vitepress-daisyui-theme'
import type { Theme as ThemeType, EnhanceAppContext } from 'vitepress'
import Landing from './Landing.vue'
import './custom.css'

/**
 * chartjs2img uses the stock vitepress-daisyui-theme. The only addition
 * here is a global <Landing /> component that /en/ and /ja/ index.md
 * mount as a full-page section driven by the page's `landing:`
 * frontmatter - same shape as gridgram.
 */
export default {
  extends: Theme,
  setup() {
    Theme.setup?.()
  },
  enhanceApp(ctx: EnhanceAppContext) {
    Theme.enhanceApp?.(ctx)
    ctx.app.component('Landing', Landing)
  },
} satisfies ThemeType
