import { createHash } from 'crypto'
import type { RenderOptions } from './template'

interface CacheEntry {
  buffer: Buffer
  contentType: string
  createdAt: number
}

const store = new Map<string, CacheEntry>()

/** Max cache entries (env: CACHE_MAX_ENTRIES, default: 1000) */
const MAX_ENTRIES = Number(process.env.CACHE_MAX_ENTRIES ?? '1000')

/** Cache TTL in ms (env: CACHE_TTL_SECONDS, default: 3600) */
const TTL_MS = Number(process.env.CACHE_TTL_SECONDS ?? '3600') * 1000

export function computeHash(options: RenderOptions): string {
  const json = JSON.stringify({
    chart: options.chart,
    width: options.width ?? 800,
    height: options.height ?? 600,
    devicePixelRatio: options.devicePixelRatio ?? 2,
    backgroundColor: options.backgroundColor ?? 'white',
    format: options.format ?? 'png',
    quality: options.quality ?? 90,
  })
  return createHash('sha256').update(json).digest('hex').slice(0, 16)
}

export function getCache(hash: string): CacheEntry | undefined {
  const entry = store.get(hash)
  if (!entry) return undefined
  if (Date.now() - entry.createdAt > TTL_MS) {
    store.delete(hash)
    return undefined
  }
  return entry
}

export function setCache(hash: string, buffer: Buffer, contentType: string): void {
  // Evict oldest if at capacity
  if (store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next().value
    if (oldest) store.delete(oldest)
  }
  store.set(hash, { buffer, contentType, createdAt: Date.now() })
}

export function cacheStats(): { size: number; maxEntries: number; ttlSeconds: number } {
  return { size: store.size, maxEntries: MAX_ENTRIES, ttlSeconds: TTL_MS / 1000 }
}
