// Examples gallery HTML generator — pure string output. We assert on
// the invariants callers rely on: the API_KEY leak fix (P0-1) does
// not accidentally regress, auth header is only wired up when a key
// exists, and the version footer surfaces.
import { describe, test, expect } from 'bun:test'
import { buildExamplesHtml } from '../../src/examples-gallery'

describe('buildExamplesHtml', () => {
  test('returns a complete HTML document', () => {
    const html = buildExamplesHtml('https://example.test')
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true)
    expect(html).toContain('chartjs2img Examples')
    expect(html).toContain('grid-gallery')
  })

  test('without API key: page embeds empty key and the client falls back to no-auth', () => {
    const html = buildExamplesHtml('https://example.test')
    expect(html).toContain('const API_KEY = ""')
  })

  test('with API key: key is embedded for the client to use (intentional)', () => {
    // Safe because /examples itself is auth-gated (P0-1). A client that
    // received the HTML already holds the key.
    const html = buildExamplesHtml('https://example.test', 's3cret-abc123')
    expect(html).toContain('const API_KEY = "s3cret-abc123"')
  })

  test('version is rendered in the footer', () => {
    const html = buildExamplesHtml('https://example.test', undefined, '9.9.9')
    expect(html).toContain('chartjs2img v9.9.9')
  })

  test('absent version falls back to "dev"', () => {
    const html = buildExamplesHtml('https://example.test')
    expect(html).toContain('chartjs2img vdev')
  })

  test('baseUrl is used for /render and /health calls', () => {
    const html = buildExamplesHtml('https://api.example.test:8080')
    expect(html).toContain('const BASE = "https://api.example.test:8080"')
  })

  test('embeds every EXAMPLE so the gallery renders client-side', () => {
    const html = buildExamplesHtml('https://example.test')
    expect(html).toContain('"title":"Bar Chart"')
    expect(html).toContain('"title":"Japanese Labels')
  })

  test('API key with </script> sequence cannot break out of the <script> block', () => {
    // Regression guard for the <script>-breakout vector caught during
    // P1-10 test expansion. JSON.stringify escapes " but not /; so
    // "evil"</script><script>alert(1)</script>" would close the
    // enclosing <script> block when the HTML parser scans it. The fix
    // is to escape "<" to the JSON unicode form <, which is
    // equivalent for the JS parser but invisible to the HTML tokenizer.
    const evil = 'evil"</script><script>alert(1)</script>'
    const html = buildExamplesHtml('https://example.test', evil)
    expect(html.toLowerCase()).not.toContain('</script><script>')
    // The payload survives as a JS string via unicode escapes.
    expect(html).toContain('\\u003c/script>')
  })

  test('baseUrl with </script> sequence is likewise escaped (Host header attack)', () => {
    // url.host derives from the request's Host header, so it is
    // attacker-controlled. Same escape applies.
    const evilBase = 'https://example.test</script><img src=x>'
    const html = buildExamplesHtml(evilBase)
    expect(html.toLowerCase()).not.toContain('</script><img')
    expect(html).toContain('\\u003c/script>')
  })
})
