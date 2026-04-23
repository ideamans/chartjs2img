import { withTheme } from 'vitepress-daisyui-theme/config'

/**
 * Three-entry structure (mirrors gridgram):
 *   - /         Language-select landing (neutral; picks /en/ or /ja/)
 *   - /en/…     English docs
 *   - /ja/…     Japanese docs
 *
 * VitePress requires a `root` locale. We use it to host ONLY the top-level
 * language picker at `/index.md`; the English docs live entirely under
 * `/en/*`, matching the `/ja/*` shape.
 */

/**
 * Force light mode, even if a returning visitor's localStorage /
 * prefers-color-scheme asks for dark. `appearance: false` in the config
 * disables VitePress's own toggle, but vitepress-daisyui-theme still
 * injects a FOUC script that sets `data-theme="dark"` based on
 * localStorage / media query. This snippet runs AFTER that script (it's
 * appended to the head array post-withTheme) and overrides both.
 */
const FORCE_LIGHT_SCRIPT = `(()=>{try{localStorage.removeItem('vitepress-theme-appearance');}catch(e){}document.documentElement.dataset.theme='light';document.documentElement.classList.remove('dark');})();`

// `withTheme` returns a VitePress config with the daisyui FOUC script
// already injected. We capture the result so we can append our own
// force-light script *after* theirs.
const config: ReturnType<typeof withTheme> = withTheme({
  title: 'chartjs2img',
  description:
    'Server-side Chart.js rendering service — CLI + HTTP API, 12 plugins bundled, image output via headless Chromium. Built for contexts without a browser (email, PDF, slides) and for LLM-authored charts.',
  cleanUrls: true,
  lastUpdated: true,
  // Skeleton pages won't all exist until Phase 1 completes — relax until content lands.
  ignoreDeadLinks: true,

  // Lock to light mode. `appearance: false` disables VitePress's
  // dark-mode machinery entirely. The daisyui theme still renders its
  // ThemeSwitch button in the header, so we hide it via CSS in
  // docs/.vitepress/theme/custom.css.
  appearance: false,

  themeConfig: {
    search: {
      provider: 'local',
      options: {
        locales: {
          ja: {
            translations: {
              button: {
                buttonText: '検索',
                buttonAriaLabel: '検索',
              },
              modal: {
                displayDetails: '詳細を表示',
                resetButtonTitle: '検索をリセット',
                backButtonTitle: '検索を閉じる',
                noResultsText: '結果が見つかりません',
                footer: {
                  selectText: '選択',
                  selectKeyAriaLabel: 'enter',
                  navigateText: '移動',
                  navigateUpKeyAriaLabel: '上矢印',
                  navigateDownKeyAriaLabel: '下矢印',
                  closeText: '閉じる',
                  closeKeyAriaLabel: 'escape',
                },
              },
            },
          },
        },
      },
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/ideamans/chartjs2img' }],
    footer: {
      copyright: "© ideaman's Inc.",
    },
  },

  locales: {
    root: {
      label: '',
      lang: 'en',
    },

    en: {
      label: 'English',
      lang: 'en',
      themeConfig: {
        logoLink: '/en/',
        nav: [
          { text: 'User Guide', link: '/en/guide/' },
          { text: 'Developer Guide', link: '/en/developer/' },
          { text: 'AI Guide', link: '/en/ai/' },
          { text: 'Gallery', link: '/en/gallery/' },
        ],
        sidebar: {
          '/en/guide/': [
            {
              text: 'Getting Started',
              items: [
                { text: 'Quick start', link: '/en/guide/' },
                { text: 'Install', link: '/en/guide/install' },
              ],
            },
            {
              text: 'Using chartjs2img',
              items: [
                { text: 'HTTP API', link: '/en/guide/http-api' },
                { text: 'CLI', link: '/en/guide/cli' },
                { text: 'Cache', link: '/en/guide/cache' },
                { text: 'Authentication', link: '/en/guide/auth' },
                { text: 'Error feedback', link: '/en/guide/error-feedback' },
                { text: 'Environment variables', link: '/en/guide/env-vars' },
                { text: 'Docker', link: '/en/guide/docker' },
                { text: 'Bundled plugins', link: '/en/guide/plugins' },
              ],
            },
          ],
          '/en/developer/': [
            {
              text: 'Developer Guide',
              items: [
                { text: 'Overview', link: '/en/developer/' },
                { text: 'Library API (TypeScript)', link: '/en/developer/library-api' },
                { text: 'Architecture', link: '/en/developer/architecture' },
                { text: 'Modules', link: '/en/developer/modules' },
                { text: 'Types & HTTP schema', link: '/en/developer/types' },
                { text: 'Adding a Chart.js plugin', link: '/en/developer/adding-plugin' },
                { text: 'Adding LLM docs', link: '/en/developer/adding-llm-doc' },
                { text: 'Error handling', link: '/en/developer/error-handling' },
              ],
            },
          ],
          '/en/ai/': [
            {
              text: 'AI Guide',
              items: [{ text: 'Overview', link: '/en/ai/' }],
            },
            {
              text: 'Tutorials',
              items: [
                { text: 'Claude Code plugin', link: '/en/ai/claude-plugin' },
                { text: 'gh skill (Copilot / Cursor / …)', link: '/en/ai/gh-skill' },
                { text: 'context7 (MCP retrieval)', link: '/en/ai/context7' },
              ],
            },
            {
              text: 'Reference',
              items: [
                { text: 'chartjs2img llm', link: '/en/ai/cli' },
                { text: 'llms.txt', link: '/en/ai/llms-txt' },
              ],
            },
          ],
          '/en/gallery/': [
            {
              text: 'Gallery',
              items: [
                { text: 'Overview', link: '/en/gallery/' },
                { text: 'Basic chart types', link: '/en/gallery/basic' },
                { text: 'Composite charts', link: '/en/gallery/composite' },
                { text: 'Labels & annotation', link: '/en/gallery/decorations' },
                { text: 'Exotic plugins', link: '/en/gallery/exotic' },
                { text: 'Sizing', link: '/en/gallery/sizing' },
                { text: 'Internationalization', link: '/en/gallery/i18n' },
              ],
            },
          ],
        },
        editLink: {
          pattern: 'https://github.com/ideamans/chartjs2img/edit/main/docs/:path',
        },
      },
    },

    ja: {
      label: '日本語',
      lang: 'ja',
      themeConfig: {
        logoLink: '/ja/',
        nav: [
          { text: 'ユーザーガイド', link: '/ja/guide/' },
          { text: '開発者ガイド', link: '/ja/developer/' },
          { text: 'AI ガイド', link: '/ja/ai/' },
          { text: 'ギャラリー', link: '/ja/gallery/' },
        ],
        sidebar: {
          '/ja/guide/': [
            {
              text: 'はじめに',
              items: [
                { text: 'クイックスタート', link: '/ja/guide/' },
                { text: 'インストール', link: '/ja/guide/install' },
              ],
            },
            {
              text: 'chartjs2img を使う',
              items: [
                { text: 'HTTP API', link: '/ja/guide/http-api' },
                { text: 'CLI', link: '/ja/guide/cli' },
                { text: 'キャッシュ', link: '/ja/guide/cache' },
                { text: '認証', link: '/ja/guide/auth' },
                { text: 'エラーフィードバック', link: '/ja/guide/error-feedback' },
                { text: '環境変数', link: '/ja/guide/env-vars' },
                { text: 'Docker', link: '/ja/guide/docker' },
                { text: '同梱プラグイン', link: '/ja/guide/plugins' },
              ],
            },
          ],
          '/ja/developer/': [
            {
              text: '開発者ガイド',
              items: [
                { text: '概要', link: '/ja/developer/' },
                { text: 'ライブラリ API (TypeScript)', link: '/ja/developer/library-api' },
                { text: 'アーキテクチャ', link: '/ja/developer/architecture' },
                { text: 'モジュール', link: '/ja/developer/modules' },
                { text: '型と HTTP スキーマ', link: '/ja/developer/types' },
                { text: 'Chart.js プラグインの追加', link: '/ja/developer/adding-plugin' },
                { text: 'LLM ドキュメントの追加', link: '/ja/developer/adding-llm-doc' },
                { text: 'エラーハンドリング', link: '/ja/developer/error-handling' },
              ],
            },
          ],
          '/ja/ai/': [
            {
              text: 'AI ガイド',
              items: [{ text: '概要', link: '/ja/ai/' }],
            },
            {
              text: 'チュートリアル',
              items: [
                { text: 'Claude Code プラグイン', link: '/ja/ai/claude-plugin' },
                { text: 'gh skill (Copilot / Cursor / …)', link: '/ja/ai/gh-skill' },
                { text: 'context7 (MCP 取得)', link: '/ja/ai/context7' },
              ],
            },
            {
              text: 'リファレンス',
              items: [
                { text: 'chartjs2img llm', link: '/ja/ai/cli' },
                { text: 'llms.txt', link: '/ja/ai/llms-txt' },
              ],
            },
          ],
          '/ja/gallery/': [
            {
              text: 'ギャラリー',
              items: [
                { text: '概要', link: '/ja/gallery/' },
                { text: '基本チャートタイプ', link: '/ja/gallery/basic' },
                { text: '複合チャート', link: '/ja/gallery/composite' },
                { text: 'ラベルと注釈', link: '/ja/gallery/decorations' },
                { text: '拡張プラグイン', link: '/ja/gallery/exotic' },
                { text: 'サイズ', link: '/ja/gallery/sizing' },
                { text: '国際化', link: '/ja/gallery/i18n' },
              ],
            },
          ],
        },
        editLink: {
          pattern: 'https://github.com/ideamans/chartjs2img/edit/main/docs/:path',
          text: 'このページを編集',
        },
      },
    },
  },
})

// Append the force-light script AFTER withTheme's FOUC block so it
// runs last in document.head and wins.
config.head = [
  ...(config.head ?? []),
  ['script', { id: 'c2i-force-light' }, FORCE_LIGHT_SCRIPT],
]

export default config
