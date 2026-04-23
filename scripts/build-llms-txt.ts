#!/usr/bin/env bun
/**
 * Generate docs/public/llms.txt (the llmstxt.org index format) and
 * docs/public/llms-full.txt (full concatenated markdown of the English
 * docs + the LLM reference aggregated from src/llm-docs/).
 *
 * - llms.txt follows the spec at https://llmstxt.org/ (H1 / blockquote /
 *   optional body / H2-delimited link sections). Links are absolute URLs
 *   into the deployed docs site so external agents can fetch each page
 *   directly.
 * - llms-full.txt is a single file that concatenates every doc's markdown
 *   (Mintlify + Anthropic convention) plus `chartjs2img llm` output.
 *   That's the "give me everything in one payload" version.
 *
 * Re-run via `bun run build-llms-txt`. Also wired into `ai:regen` and
 * `docs:build` via package.json.
 *
 * Both output files live under docs/public/ (VitePress serves the dir
 * as the site root). They are gitignored — always regenerated at build.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, readdirSync } from 'fs'
import { join, relative } from 'path'
import { getLlmDocs } from '../src/llm-docs'
import { VERSION } from '../src/version'

const root = process.cwd()
const DOCS_EN = join(root, 'docs/en')
const OUT_DIR = join(root, 'docs/public')
const SITE_BASE = process.env.CHARTJS2IMG_DOCS_URL?.replace(/\/$/, '') ?? 'https://chartjs2img.ideamans.com'

interface DocPage {
  /** Route path used in the deployed docs (e.g. "/en/guide/cli"). */
  route: string
  /** Display title (from frontmatter or first H1 or filename). */
  title: string
  /** Absolute filesystem path to the .md source. */
  file: string
  /** File body, frontmatter stripped. */
  body: string
}

function walkMarkdown(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const s = statSync(full)
    if (s.isDirectory()) out.push(...walkMarkdown(full))
    else if (s.isFile() && entry.endsWith('.md')) out.push(full)
  }
  return out
}

/** Strip a leading `---\n … \n---\n` frontmatter block and return (fm, body). */
function splitFrontmatter(src: string): { frontmatter: Record<string, string>; body: string } {
  const fm: Record<string, string> = {}
  if (!src.startsWith('---\n')) return { frontmatter: fm, body: src }
  const end = src.indexOf('\n---', 4)
  if (end === -1) return { frontmatter: fm, body: src }
  const block = src.slice(4, end)
  // Cheap YAML parse: only flat `key: value` lines. That's all the docs use
  // at the outermost level that we care about here (title, description).
  for (const line of block.split('\n')) {
    const m = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/)
    if (m) fm[m[1]!] = m[2]!.trim().replace(/^['"]|['"]$/g, '')
  }
  // +4 skips the closing "\n---" plus one newline after.
  const rest = src.slice(end + 4)
  return { frontmatter: fm, body: rest.replace(/^\n/, '') }
}

/** Derive a route like "/en/guide/cli" from an absolute .md path. */
function routeOf(file: string): string {
  let r = '/' + relative(root, file).replace(/\.md$/, '')
  // `index.md` collapses to its directory route.
  r = r.replace(/\/index$/, '/')
  // Trim trailing slash for non-root routes so URLs are predictable.
  if (r !== '/' && r.endsWith('/')) r = r.slice(0, -1)
  // VitePress serves `docs/` as the root of the site — strip the prefix.
  return r.replace(/^\/docs/, '')
}

function titleOf(fm: Record<string, string>, body: string, file: string): string {
  if (fm.title) return fm.title
  const h1 = body.match(/^#\s+(.+)$/m)
  if (h1) return h1[1]!.trim()
  // Fallback: humanize the filename.
  const base = file.split('/').pop()!.replace(/\.md$/, '').replace(/-/g, ' ')
  return base.charAt(0).toUpperCase() + base.slice(1)
}

function loadPages(): DocPage[] {
  const pages: DocPage[] = []
  for (const file of walkMarkdown(DOCS_EN)) {
    const src = readFileSync(file, 'utf-8')
    const { frontmatter, body } = splitFrontmatter(src)
    pages.push({
      route: routeOf(file),
      title: titleOf(frontmatter, body, file),
      file,
      body,
    })
  }
  // Stable ordering by route.
  pages.sort((a, b) => (a.route < b.route ? -1 : a.route > b.route ? 1 : 0))
  return pages
}

// Slug → display label. Anything missing falls through to simple
// capitalization. Keeps acronyms and multi-word labels clean in llms.txt.
const GROUP_LABELS: Record<string, string> = {
  ai: 'AI Guide',
  developer: 'Developer Guide',
  gallery: 'Gallery',
  guide: 'User Guide',
}

function groupForIndex(pages: DocPage[]): Map<string, DocPage[]> {
  // Group by first path segment after /en/: guide / developer / ai / gallery.
  const groups = new Map<string, DocPage[]>()
  for (const p of pages) {
    const parts = p.route.split('/').filter(Boolean)
    // parts[0] === 'en'
    const slug = parts.length < 2 ? 'home' : parts[1]!
    const group = GROUP_LABELS[slug] ?? capitalize(slug)
    if (!groups.has(group)) groups.set(group, [])
    groups.get(group)!.push(p)
  }
  return groups
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function renderIndex(pages: DocPage[]): string {
  const groups = groupForIndex(pages)
  const lines: string[] = []
  lines.push('# chartjs2img')
  lines.push('')
  lines.push(
    `> Server-side Chart.js rendering service (v${VERSION}). CLI + HTTP API that takes a Chart.js configuration JSON and returns a PNG/JPEG/WebP image via headless Chromium. Bundles Chart.js 4.4 + 12 ecosystem plugins. Built for contexts without a browser (email, PDF, slides) and for LLM agents that write Chart.js configs.`,
  )
  lines.push('')
  lines.push(
    'The `chartjs2img` binary exposes `serve` (HTTP API), `render` (one-shot CLI), `examples` (render the built-in gallery), and `llm` (dump the Chart.js + plugin reference as Markdown for agent context).',
  )
  lines.push('')

  // Canonical order for the top-level groups.
  const order = ['Home', 'User Guide', 'Developer Guide', 'AI Guide', 'Gallery']
  const seen = new Set<string>()

  const emitGroup = (name: string, items: DocPage[]) => {
    lines.push(`## ${name}`)
    lines.push('')
    for (const p of items) {
      const url = `${SITE_BASE}${p.route}.md`
      lines.push(`- [${p.title}](${url})`)
    }
    lines.push('')
  }

  for (const g of order) {
    const items = groups.get(g)
    if (items && items.length > 0) {
      emitGroup(g, items)
      seen.add(g)
    }
  }
  // Anything left over (unexpected group) goes under Optional.
  const leftover: DocPage[] = []
  for (const [g, items] of groups) if (!seen.has(g)) leftover.push(...items)
  if (leftover.length > 0) {
    lines.push('## Optional')
    lines.push('')
    for (const p of leftover) {
      const url = `${SITE_BASE}${p.route}.md`
      lines.push(`- [${p.title}](${url})`)
    }
    lines.push('')
  }

  // Always append the full LLM reference bundle pointer.
  lines.push('## LLM reference (single bundle)')
  lines.push('')
  lines.push(
    `- [chartjs2img LLM reference](${SITE_BASE}/llms-full.txt): full docs + Chart.js / plugin reference, concatenated for one-shot context windows.`,
  )
  lines.push('')

  return lines.join('\n')
}

function renderFull(pages: DocPage[]): string {
  const lines: string[] = []
  lines.push(`# chartjs2img — full documentation (v${VERSION})`)
  lines.push('')
  lines.push(
    '> Concatenated English docs plus the aggregated `chartjs2img llm` reference (Chart.js core + 12 bundled plugins). Auto-generated; do not edit by hand.',
  )
  lines.push('')
  for (const p of pages) {
    lines.push(`<!-- source: ${relative(root, p.file)} -->`)
    lines.push(`<!-- route: ${p.route} -->`)
    lines.push('')
    lines.push(p.body.trim())
    lines.push('')
    lines.push('---')
    lines.push('')
  }

  // Append the LLM reference (a completely different kind of content: usage
  // spec + Chart.js option tables + plugin option tables + JSON examples).
  // Importing getLlmDocs() directly avoids needing a generated intermediate file.
  lines.push('<!-- source: src/llm-docs/** (via chartjs2img llm) -->')
  lines.push('')
  lines.push(getLlmDocs().trim())
  lines.push('')
  return lines.join('\n')
}

function main(): void {
  if (!existsSync(DOCS_EN)) {
    console.error(`Missing ${DOCS_EN} — no English docs to index.`)
    process.exit(1)
  }
  const pages = loadPages()
  const index = renderIndex(pages)
  const full = renderFull(pages)
  mkdirSync(OUT_DIR, { recursive: true })
  const idxPath = join(OUT_DIR, 'llms.txt')
  const fullPath = join(OUT_DIR, 'llms-full.txt')
  writeFileSync(idxPath, index)
  writeFileSync(fullPath, full)
  console.log(`  wrote ${index.length} chars → ${idxPath}`)
  console.log(`  wrote ${full.length} chars → ${fullPath} (${pages.length} docs concatenated)`)
}

main()
