// Server entry — a thin HTTP wrapper around the internal render
// pipeline. All rendering semantics (plugin registration, cache,
// concurrency, Chromium lifecycle) live in ./renderer; this file only
// adds transport concerns (auth, routing, cache-hash URL).
//
// NOTE: internal files import directly from their source modules
// (./renderer, ./cache, ./template) rather than going through ./lib.
// ./lib is the *public* surface for external TypeScript consumers and
// must not be a dependency of internal code — that would make its
// export list a constraint on internal refactoring.
import { renderChart, rendererStats } from './renderer'
import type { RenderOptions } from './template'
import { getCache, cacheStats } from './cache'
import { buildExamplesHtml } from './examples'
import { VERSION } from './version'

export interface ServerConfig {
  port: number
  host: string
  apiKey?: string
}

/**
 * Handle returned by startServer. The caller owns the server lifetime
 * and is responsible for deciding when to stop it. Signal handling
 * (SIGINT/SIGTERM) is intentionally NOT installed here — a library
 * function must not mutate process-global state. The CLI installs its
 * own handler in src/index.ts.
 */
export interface ServerHandle {
  port: number
  hostname: string
  stop(): Promise<void>
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

/**
 * Client-supplied input was invalid. Distinct from internal errors so
 * the HTTP layer can map it to a 400 instead of 500 — a monitoring
 * signal, not just a UX nicety.
 */
class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

function parseRenderOptions(body: Record<string, unknown>): RenderOptions {
  if (!body.chart || typeof body.chart !== 'object') {
    throw new ValidationError('Missing or invalid required field: chart (must be an object)')
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

export async function startServer(config: ServerConfig): Promise<ServerHandle> {
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

      // Examples gallery. When API_KEY is configured, viewing the page
      // also requires auth — otherwise the page would embed the key in
      // its HTML for the subsequent /render calls and any unauthenticated
      // fetch would leak it.
      if (url.pathname === '/examples') {
        if (!checkAuth(req, config.apiKey)) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }
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
          try {
            body = (await req.json()) as Record<string, unknown>
          } catch (parseErr) {
            throw new ValidationError(
              `Invalid JSON body: ${parseErr instanceof Error ? parseErr.message : 'parse failed'}`,
            )
          }
        } else if (req.method === 'GET') {
          const chartParam = url.searchParams.get('chart')
          if (!chartParam) {
            throw new ValidationError('Missing required query parameter: chart')
          }
          let parsedChart: unknown
          try {
            parsedChart = JSON.parse(chartParam)
          } catch (parseErr) {
            throw new ValidationError(
              `Invalid JSON in chart query parameter: ${parseErr instanceof Error ? parseErr.message : 'parse failed'}`,
            )
          }
          body = {
            chart: parsedChart,
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
        if (err instanceof ValidationError) {
          return Response.json({ error: err.message }, { status: 400 })
        }
        const message = err instanceof Error ? err.message : 'Internal server error'
        console.error('[server] Render error:', message)
        return Response.json({ error: message }, { status: 500 })
      }
  }

  console.log(`chartjs2img v${VERSION} listening on http://${server.hostname}:${server.port}`)
  console.log(`  POST /render      - render chart from JSON body`)
  console.log(`  GET  /render      - render chart from query params`)
  console.log(`  GET  /cache/:hash - retrieve cached image`)
  console.log(`  GET  /examples    - examples gallery`)
  console.log(`  GET  /health      - health check + stats`)
  if (config.apiKey) {
    console.log(`  Authentication: enabled (API key)`)
  }

  // Bun's Server types port/hostname as optional, but after a successful
  // listen both are always populated. Fall back to the requested values
  // if needed to keep the Handle shape strict.
  return {
    port: server.port ?? config.port,
    hostname: server.hostname ?? config.host,
    async stop() {
      await server.stop()
    },
  }
}
