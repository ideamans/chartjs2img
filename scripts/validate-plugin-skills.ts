#!/usr/bin/env bun
/**
 * Validate every SKILL.md under plugins/** against the Agent Skills open
 * standard (https://agentskills.io/specification).
 *
 * Standards-compliant fields only:
 *   name (1–64 chars, kebab-case, no leading/trailing or consecutive hyphens,
 *         must match parent directory name)
 *   description (1–1024 chars, non-empty)
 *   license (optional)
 *   compatibility (optional, ≤500 chars)
 *   metadata (optional, string→string map)
 *   allowed-tools (optional, experimental — space-separated string)
 *
 * Anything else is flagged as non-standard so skills stay portable across
 * Claude Code / Copilot / Cursor / Gemini CLI / Codex via `gh skill`.
 *
 * Additionally enforces:
 *   - plugins/<name>/.claude-plugin/plugin.json `version` matches
 *     root `package.json` `version`
 *   - per-skill discovery-keyword assertions (one or more of a set of words
 *     must appear in the description, so agent hosts rank it correctly)
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'fs'
import { join, basename, relative } from 'path'

const STANDARD_FIELDS = new Set(['name', 'description', 'license', 'compatibility', 'metadata', 'allowed-tools'])

interface Frontmatter {
  [key: string]: string | Record<string, string> | undefined
}

interface Issue {
  file: string
  severity: 'error' | 'warn'
  message: string
}

function splitFrontmatter(src: string): { frontmatter: string; body: string } | null {
  if (!src.startsWith('---\n')) return null
  const end = src.indexOf('\n---', 4)
  if (end === -1) return null
  return { frontmatter: src.slice(4, end), body: src.slice(end + 4).replace(/^\n/, '') }
}

function parseFlatYaml(text: string): Frontmatter {
  // Minimal flat YAML: `key: value` plus a single-nested `metadata:` block with
  // two-space-indented `key: value` entries. Enough for SKILL.md frontmatter.
  const out: Frontmatter = {}
  let inMetadata = false
  const meta: Record<string, string> = {}
  for (const rawLine of text.split('\n')) {
    if (rawLine.trim() === '' || rawLine.trim().startsWith('#')) continue
    if (inMetadata && rawLine.startsWith('  ')) {
      const m = rawLine.trimStart().match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/)
      if (m) meta[m[1]!] = m[2]!.replace(/^['"]|['"]$/g, '')
      continue
    }
    inMetadata = false
    const m = rawLine.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/)
    if (!m) continue
    const key = m[1]!
    const value = m[2]!
    if (key === 'metadata' && value.trim() === '') {
      inMetadata = true
      continue
    }
    out[key] = value.replace(/^['"]|['"]$/g, '')
  }
  if (Object.keys(meta).length > 0) out.metadata = meta
  return out
}

function walkSkillDirs(root: string): string[] {
  const found: string[] = []
  if (!existsSync(root)) return found
  const visit = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      const s = statSync(full)
      if (s.isDirectory()) visit(full)
      else if (s.isFile() && basename(full) === 'SKILL.md') found.push(dir)
    }
  }
  visit(root)
  return found
}

const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/

/**
 * Per-skill discovery-keyword assertions. Each skill name maps to a list
 * of keyword lists; the description must contain at least one word from
 * EACH inner list (so "render a Chart.js chart to an image" satisfies
 * the render skill's { "render", Chart.js + image }).
 */
const KEYWORD_ASSERTIONS: Record<string, string[][]> = {
  'chartjs2img-render': [['render', 'Render'], ['Chart.js', 'chart'], ['image', 'PNG', 'JPEG', 'WebP']],
  'chartjs2img-author': [['compose', 'author', 'Compose', 'generate', 'Generate'], ['chart', 'Chart.js'], ['visualize', 'visualise', 'draw', 'plot']],
  'chartjs2img-install': [['install', 'Install', 'update'], ['chartjs2img', 'CLI']],
}

export interface ValidationResult {
  skillDirs: string[]
  issues: Issue[]
}

export function validatePluginSkills(rootDir: string, repoRoot: string): ValidationResult {
  const skillDirs = walkSkillDirs(rootDir)
  const issues: Issue[] = []

  for (const dir of skillDirs) {
    const path = join(dir, 'SKILL.md')
    const src = readFileSync(path, 'utf-8')
    const split = splitFrontmatter(src)
    if (!split) {
      issues.push({ file: path, severity: 'error', message: 'missing YAML frontmatter (must start with `---` and end with `---`)' })
      continue
    }
    const fm = parseFlatYaml(split.frontmatter)
    const name = fm.name as string | undefined
    const desc = fm.description as string | undefined

    // name
    if (!name) {
      issues.push({ file: path, severity: 'error', message: 'missing required field: name' })
    } else {
      if (name.length < 1 || name.length > 64) {
        issues.push({ file: path, severity: 'error', message: `name "${name}" must be 1–64 characters (got ${name.length})` })
      }
      if (!NAME_RE.test(name)) {
        issues.push({ file: path, severity: 'error', message: `name "${name}" must be kebab-case` })
      }
      const parent = basename(dir)
      if (name !== parent) {
        issues.push({ file: path, severity: 'error', message: `name "${name}" must match the parent directory "${parent}"` })
      }
    }

    // description
    if (!desc) {
      issues.push({ file: path, severity: 'error', message: 'missing required field: description' })
    } else {
      if (desc.length < 1 || desc.length > 1024) {
        issues.push({ file: path, severity: 'error', message: `description must be 1–1024 characters (got ${desc.length})` })
      }
    }

    // compatibility (≤500 chars)
    const compat = fm.compatibility as string | undefined
    if (compat && compat.length > 500) {
      issues.push({ file: path, severity: 'error', message: `compatibility must be ≤500 characters (got ${compat.length})` })
    }

    // Flag non-standard top-level fields (excluding `metadata`, which is the
    // escape hatch for vendor-specific config).
    for (const k of Object.keys(fm)) {
      if (!STANDARD_FIELDS.has(k)) {
        issues.push({
          file: path,
          severity: 'warn',
          message: `non-standard frontmatter key "${k}" — move under metadata.<vendor>.<key> for cross-host portability`,
        })
      }
    }

    // Keyword assertions (description discovery ranking)
    if (name && desc && KEYWORD_ASSERTIONS[name]) {
      for (const group of KEYWORD_ASSERTIONS[name]!) {
        if (!group.some((word) => desc.includes(word))) {
          issues.push({
            file: path,
            severity: 'error',
            message: `description for "${name}" is missing a keyword from [${group.join(' | ')}]`,
          })
        }
      }
    }
  }

  // plugin.json version checks
  const pluginDirs = readdirSync(rootDir)
    .map((e) => join(rootDir, e))
    .filter((p) => statSync(p).isDirectory() && existsSync(join(p, '.claude-plugin', 'plugin.json')))

  const pkgJsonPath = join(repoRoot, 'package.json')
  if (existsSync(pkgJsonPath)) {
    const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf-8')) as { version?: string }
    const expected = pkg.version

    for (const pd of pluginDirs) {
      const manifest = join(pd, '.claude-plugin', 'plugin.json')
      const json = JSON.parse(readFileSync(manifest, 'utf-8')) as { name?: string; version?: string }
      if (!json.version) {
        issues.push({ file: manifest, severity: 'error', message: 'plugin.json missing "version" field' })
      } else if (json.version !== expected) {
        issues.push({
          file: manifest,
          severity: 'error',
          message: `plugin.json version "${json.version}" must match root package.json version "${expected}"`,
        })
      }
    }
  }

  return { skillDirs, issues }
}

function formatIssue(issue: Issue, root: string): string {
  const rel = relative(root, issue.file)
  const tag = issue.severity === 'error' ? 'ERROR' : 'warn '
  return `  ${tag}  ${rel}  —  ${issue.message}`
}

function main(): void {
  const repoRoot = process.cwd()
  const pluginsRoot = join(repoRoot, 'plugins')
  const { skillDirs, issues } = validatePluginSkills(pluginsRoot, repoRoot)
  console.log(`Checked ${skillDirs.length} skill directories under plugins/`)
  const errors = issues.filter((i) => i.severity === 'error')
  const warnings = issues.filter((i) => i.severity === 'warn')
  for (const issue of issues) console.log(formatIssue(issue, repoRoot))
  console.log(`  ${errors.length} error(s), ${warnings.length} warning(s)`)
  if (errors.length > 0) process.exit(1)
}

if (import.meta.main) main()
