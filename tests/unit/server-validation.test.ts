// Server routing + validation contract. These exercises never reach
// renderChart so they don't need Chromium and stay fast — the value
// is locking in the 400/401/404/405 mapping that P0-1 and P0-3
// established (auth + input-error surfacing).
import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import { startServer, type ServerHandle } from '../../src/server'

async function pickFreePort(): Promise<number> {
  const s = Bun.serve({ port: 0, fetch: () => new Response('x') })
  const p = s.port
  s.stop()
  return p
}

describe('server routing / validation (no Chromium)', () => {
  let handle: ServerHandle
  let base: string

  beforeAll(async () => {
    const port = await pickFreePort()
    handle = await startServer({ port, host: '127.0.0.1' })
    base = `http://127.0.0.1:${handle.port}`
  })

  afterAll(async () => {
    await handle.stop()
  })

  test('GET unknown path → 404', async () => {
    const r = await fetch(`${base}/not-a-real-route`)
    expect(r.status).toBe(404)
  })

  test('PUT /render → 405', async () => {
    const r = await fetch(`${base}/render`, { method: 'PUT' })
    expect(r.status).toBe(405)
  })

  test('POST /render with missing chart → 400', async () => {
    const r = await fetch(`${base}/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ width: 800 }),
    })
    expect(r.status).toBe(400)
    const body = (await r.json()) as { error: string }
    expect(body.error).toMatch(/chart/i)
  })

  test('POST /render with malformed JSON → 400', async () => {
    const r = await fetch(`${base}/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{not json',
    })
    expect(r.status).toBe(400)
  })

  test('GET /render without chart param → 400', async () => {
    const r = await fetch(`${base}/render`)
    expect(r.status).toBe(400)
  })

  test('GET /render with invalid JSON in chart param → 400', async () => {
    const r = await fetch(`${base}/render?chart=%7Bnope`)
    expect(r.status).toBe(400)
  })

  test('/health is unauthenticated and returns stats', async () => {
    const r = await fetch(`${base}/health`)
    expect(r.status).toBe(200)
    const body = (await r.json()) as { status: string; renderer: unknown; cache: unknown }
    expect(body.status).toBe('ok')
    expect(body.renderer).toBeDefined()
    expect(body.cache).toBeDefined()
  })
})

describe('server auth (API_KEY set)', () => {
  let handle: ServerHandle
  let base: string
  const API_KEY = 's3cret-test-key'

  beforeAll(async () => {
    const port = await pickFreePort()
    handle = await startServer({ port, host: '127.0.0.1', apiKey: API_KEY })
    base = `http://127.0.0.1:${handle.port}`
  })

  afterAll(async () => {
    await handle.stop()
  })

  test('POST /render without key → 401', async () => {
    const r = await fetch(`${base}/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chart: {} }),
    })
    expect(r.status).toBe(401)
  })

  test('GET /examples without key → 401 (no API_KEY leak in HTML)', async () => {
    const r = await fetch(`${base}/examples`)
    // Key fix: P0-1 — unauthenticated /examples used to return the
    // page with the API key embedded client-side.
    expect(r.status).toBe(401)
  })

  test('GET /examples with key → 200', async () => {
    const r = await fetch(`${base}/examples?api_key=${API_KEY}`)
    expect(r.status).toBe(200)
    expect(r.headers.get('Content-Type')).toMatch(/text\/html/)
  })

  test('/health still unauthenticated even when API_KEY is set', async () => {
    const r = await fetch(`${base}/health`)
    expect(r.status).toBe(200)
  })

  test('accepts Authorization: Bearer', async () => {
    const r = await fetch(`${base}/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify({ width: 800 }), // still missing chart, but auth passed
    })
    expect(r.status).toBe(400)
  })

  test('accepts X-API-Key header', async () => {
    const r = await fetch(`${base}/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
      body: JSON.stringify({ width: 800 }),
    })
    expect(r.status).toBe(400)
  })

  test('accepts ?api_key= query string', async () => {
    const r = await fetch(`${base}/render?api_key=${API_KEY}`)
    // GET with no chart → 400, but that still proves auth passed.
    expect(r.status).toBe(400)
  })
})
