// Server entry — a thin HTTP wrapper around the library API in
// src/lib.ts. All rendering semantics (plugin registration, cache,
// concurrency, Chromium lifecycle) live in the library; this file
// only adds transport concerns (auth, routing, cache-hash URL).
import { renderChart, closeBrowser, rendererStats } from './lib'
import type { RenderOptions } from './lib'
import { getCache, cacheStats } from './cache'
import { buildExamplesHtml } from './examples'
import { VERSION } from './version'

export interface ServerConfig {
  port: number
  host: string
  apiKey?: string
}

function checkAuth(req: Request, apiKey?: string): boolean {
  if (!apiKey) return true

  const authHeader = req.headers.get('authorization')
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '')
    if (token === apiKey) return true
  }

  const xApiKey = req.headers.get('x-api-key')
  if (xApiKey === apiKey) return true

  const url = new URL(req.url)
  const keyParam = url.searchParams.get('api_key')
  if (keyParam === apiKey) return true

  return false
}

function parseRenderOptions(body: Record<string, unknown>): RenderOptions {
  if (!body.chart) {
    throw new Error('Missing required field: chart')
  }

  return {
    chart: body.chart as Record<string, unknown>,
    width: body.width as number | undefined,
    height: body.height as number | undefined,
    devicePixelRatio: body.devicePixelRatio as number | undefined,
    backgroundColor: body.backgroundColor as string | undefined,
    format: body.format as RenderOptions['format'] | undefined,
    quality: body.quality as number | undefined,
  }
}

const CONTENT_TYPES: Record<string, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
}

export async function startServer(config: ServerConfig): Promise<void> {
  const server = Bun.serve({
    port: config.port,
    hostname: config.host,
    async fetch(req) {
      const res = await handleRequest(req, config)
      res.headers.set('X-Powered-By', `chartjs2img/${VERSION}`)
      return res
    },
  })

  async function handleRequest(req: Request, config: ServerConfig): Promise<Response> {
      const url = new URL(req.url)

      // Health check (with extended stats)
      if (url.pathname === '/health') {
        return Response.json({
          status: 'ok',
          version: VERSION,
          renderer: rendererStats(),
          cache: cacheStats(),
        })
      }

      // Examples gallery (no auth required for viewing)
      if (url.pathname === '/examples') {
        const baseUrl = `${url.protocol}//${url.host}`
        const html = buildExamplesHtml(baseUrl, config.apiKey, VERSION)
        return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
      }

      // Cached image access: /cache/:hash
      if (url.pathname.startsWith('/cache/')) {
        if (!checkAuth(req, config.apiKey)) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const hash = url.pathname.slice('/cache/'.length)
        const cached = getCache(hash)
        if (!cached) {
          return Response.json({ error: 'Cache miss - image not found or expired' }, { status: 404 })
        }
        return new Response(cached.buffer as unknown as BodyInit, {
          headers: {
            'Content-Type': cached.contentType,
            'Content-Length': cached.buffer.length.toString(),
            'Cache-Control': 'public, max-age=3600',
          },
        })
      }

      // Render endpoint
      if (url.pathname !== '/render') {
        return Response.json({ error: 'Not found' }, { status: 404 })
      }

      if (!checkAuth(req, config.apiKey)) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
      }

      try {
        let body: Record<string, unknown>

        if (req.method === 'POST') {
          body = (await req.json()) as Record<string, unknown>
        } else if (req.method === 'GET') {
          const chartParam = url.searchParams.get('chart')
          if (!chartParam) {
            return Response.json({ error: 'Missing chart parameter' }, { status: 400 })
          }
          body = {
            chart: JSON.parse(chartParam),
            width: url.searchParams.get('width') ? Number(url.searchParams.get('width')) : undefined,
            height: url.searchParams.get('height') ? Number(url.searchParams.get('height')) : undefined,
            devicePixelRatio: url.searchParams.get('devicePixelRatio')
              ? Number(url.searchParams.get('devicePixelRatio'))
              : undefined,
            backgroundColor: url.searchParams.get('backgroundColor') || undefined,
            format: (url.searchParams.get('format') as RenderOptions['format']) || undefined,
            quality: url.searchParams.get('quality') ? Number(url.searchParams.get('quality')) : undefined,
          }
        } else {
          return Response.json({ error: 'Method not allowed' }, { status: 405 })
        }

        const options = parseRenderOptions(body)
        const result = await renderChart(options)
        const cacheUrl = `${url.protocol}//${url.host}/cache/${result.hash}`

        const headers: Record<string, string> = {
          'Content-Type': result.contentType,
          'Content-Length': result.buffer.length.toString(),
          'X-Cache-Hash': result.hash,
          'X-Cache-Url': cacheUrl,
          'X-Cache-Hit': result.cached ? 'true' : 'false',
        }

        // Include chart messages (errors/warnings) in response header
        if (result.messages.length > 0) {
          headers['X-Chart-Messages'] = JSON.stringify(result.messages)
        }

        return new Response(result.buffer as unknown as BodyInit, { headers })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error'
        console.error('[server] Render error:', message)
        return Response.json({ error: message }, { status: 500 })
      }
  }

  console.log(`chartjs2img v${VERSION} listening on http://${config.host}:${config.port}`)
  console.log(`  POST /render      - render chart from JSON body`)
  console.log(`  GET  /render      - render chart from query params`)
  console.log(`  GET  /cache/:hash - retrieve cached image`)
  console.log(`  GET  /examples    - examples gallery`)
  console.log(`  GET  /health      - health check + stats`)
  if (config.apiKey) {
    console.log(`  Authentication: enabled (API key)`)
  }

  process.on('SIGINT', async () => {
    console.log('\nShutting down...')
    await closeBrowser()
    process.exit(0)
  })
  process.on('SIGTERM', async () => {
    await closeBrowser()
    process.exit(0)
  })
}
