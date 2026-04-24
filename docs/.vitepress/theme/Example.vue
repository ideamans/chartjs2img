<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface Props {
  /**
   * Slug of the example under docs/public/examples/. Resolves to
   * `/examples/<name>.png` and `/examples/<name>.json`. Use the
   * slug-only form (not the `NN-slug` numbered form); the docs build
   * writes both and the slug-only copy is what lives at a stable URL.
   */
  name: string
  /** Initial tab. 'preview' shows the PNG; 'json' shows the config. */
  tab?: 'preview' | 'json'
  /**
   * Optional caption rendered below the tab bar. If omitted, the
   * component displays nothing above the content area.
   */
  caption?: string
  /**
   * Which HTTP verb block to show in the "HTTP" tab (if enabled). Only
   * 'post' is supported today. Set `http` to true to reveal the tab;
   * omit to hide it entirely (pure CLI / library use cases don't need
   * the HTTP snippet).
   */
  http?: boolean
  /**
   * Override the base URL shown in the HTTP snippet. Defaults to
   * http://localhost:3000 to match the `chartjs2img serve` banner.
   */
  httpBase?: string
}

const props = withDefaults(defineProps<Props>(), {
  tab: 'preview',
  http: false,
  httpBase: 'http://localhost:3000',
})

type TabId = 'preview' | 'json' | 'cli' | 'http'

const activeTab = ref<TabId>(props.tab)
const pngUrl = computed(() => `/examples/${props.name}.png`)
const jsonUrl = computed(() => `/examples/${props.name}.json`)

const configText = ref<string>('')
const loaded = ref(false)
const loadError = ref<string | null>(null)

// Pre-format CLI + HTTP snippets for copy-paste convenience. Both
// share the same chart config; the CLI pipes it through stdin, the
// HTTP variant wraps it in `{chart: …}` for the POST body.
const cliSnippet = computed(() => {
  if (!loaded.value) return ''
  const oneline = configText.value.replace(/\s+/g, ' ').trim()
  return [
    `echo '${oneline.replace(/'/g, `'\\''`)}' \\`,
    `  | chartjs2img render -o ${props.name}.png`,
  ].join('\n')
})
const httpSnippet = computed(() => {
  if (!loaded.value) return ''
  // Re-serialize rather than substring-ing: the POST body wraps the
  // config in `{chart: ...}` so we can't just splice.
  let chart: unknown
  try {
    chart = JSON.parse(configText.value)
  } catch {
    chart = {}
  }
  const body = JSON.stringify({ chart }, null, 2)
  return [
    `curl -X POST ${props.httpBase}/render \\`,
    `  -H 'Content-Type: application/json' \\`,
    `  -d '${body.replace(/'/g, `'\\''`)}' \\`,
    `  -o ${props.name}.png`,
  ].join('\n')
})

onMounted(async () => {
  try {
    const r = await fetch(jsonUrl.value)
    if (!r.ok) {
      loadError.value = `Failed to load ${jsonUrl.value} (HTTP ${r.status})`
    } else {
      const raw = await r.text()
      // Normalize to 2-space indent for display.
      try {
        configText.value = JSON.stringify(JSON.parse(raw), null, 2)
      } catch {
        configText.value = raw
      }
      loaded.value = true
    }
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : String(err)
  }
})
</script>

<template>
  <div class="c2i-example">
    <div class="c2i-example__tabs" role="tablist" aria-label="Example">
      <button
        :class="['c2i-example__tab', { 'is-active': activeTab === 'preview' }]"
        @click="activeTab = 'preview'"
        role="tab"
        :aria-selected="activeTab === 'preview'"
      >Preview</button>
      <button
        :class="['c2i-example__tab', { 'is-active': activeTab === 'json' }]"
        @click="activeTab = 'json'"
        role="tab"
        :aria-selected="activeTab === 'json'"
      >JSON</button>
      <button
        :class="['c2i-example__tab', { 'is-active': activeTab === 'cli' }]"
        @click="activeTab = 'cli'"
        role="tab"
        :aria-selected="activeTab === 'cli'"
      >CLI</button>
      <button
        v-if="http"
        :class="['c2i-example__tab', { 'is-active': activeTab === 'http' }]"
        @click="activeTab = 'http'"
        role="tab"
        :aria-selected="activeTab === 'http'"
      >HTTP</button>
      <span v-if="caption" class="c2i-example__caption">{{ caption }}</span>
    </div>

    <div v-if="activeTab === 'preview'" class="c2i-example__viewport">
      <img :src="pngUrl" :alt="name" loading="lazy" />
    </div>

    <div v-else-if="activeTab === 'json'" class="c2i-example__code">
      <pre v-if="loaded"><code>{{ configText }}</code></pre>
      <p v-else-if="loadError" class="c2i-example__error">{{ loadError }}</p>
      <p v-else class="c2i-example__loading">Loading…</p>
    </div>

    <div v-else-if="activeTab === 'cli'" class="c2i-example__code">
      <pre v-if="loaded"><code>{{ cliSnippet }}</code></pre>
      <p v-else-if="loadError" class="c2i-example__error">{{ loadError }}</p>
      <p v-else class="c2i-example__loading">Loading…</p>
    </div>

    <div v-else-if="activeTab === 'http'" class="c2i-example__code">
      <pre v-if="loaded"><code>{{ httpSnippet }}</code></pre>
      <p v-else-if="loadError" class="c2i-example__error">{{ loadError }}</p>
      <p v-else class="c2i-example__loading">Loading…</p>
    </div>
  </div>
</template>

<style scoped>
.c2i-example {
  display: flex;
  flex-direction: column;
  margin: 24px 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  overflow: hidden;
}
.c2i-example__tabs {
  display: flex;
  align-items: center;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
}
.c2i-example__tab {
  padding: 8px 14px;
  font-size: 12px;
  font-family: var(--vp-font-family-mono);
  background: transparent;
  border: 0;
  color: var(--vp-c-text-2);
  cursor: pointer;
  border-bottom: 2px solid transparent;
}
.c2i-example__tab.is-active {
  color: var(--vp-c-brand-1);
  border-bottom-color: var(--vp-c-brand-1);
}
.c2i-example__caption {
  margin-left: auto;
  padding: 0 12px;
  font-size: 12px;
  color: var(--vp-c-text-3);
}
.c2i-example__viewport {
  display: flex;
  align-items: center;
  justify-content: center;
  background: repeating-conic-gradient(#f6f6f6 0% 25%, #ffffff 25% 50%) 0 0 / 20px 20px;
  padding: 16px 24px;
  min-height: 200px;
}
.c2i-example__viewport img {
  max-width: 100%;
  height: auto;
  display: block;
}
.c2i-example__code {
  margin: 0;
  background: var(--vp-code-block-bg, var(--vp-c-bg-alt));
}
.c2i-example__code pre {
  margin: 0;
  padding: 16px 20px;
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.55;
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-text-1);
  background: transparent;
}
.c2i-example__code code {
  font-family: inherit;
  white-space: pre;
}
.c2i-example__loading,
.c2i-example__error {
  margin: 0;
  padding: 16px 20px;
  font-size: 13px;
  color: var(--vp-c-text-2);
}
.c2i-example__error {
  color: #b91c1c;
}
</style>
