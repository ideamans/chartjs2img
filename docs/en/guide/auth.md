---
title: Authentication
description: Optional API key authentication for chartjs2img - three header and query-string options, plus which endpoints require it.
---

# Authentication

API key authentication is **optional**. When disabled (the default),
all endpoints are reachable anonymously. When enabled, `/render` and
`/cache/:hash` require a key; `/health` and `/examples` remain open.

## Enabling

Pick one of the two:

```bash
# CLI flag
chartjs2img serve --api-key s3cret

# Environment variable
API_KEY=s3cret chartjs2img serve
```

Either is fine; CLI flag wins if both are set.

## Passing the key

Clients may pass the key in three ways. Pick whichever fits your call
site; the server accepts all three.

### Authorization header (Bearer)

```bash
curl -H 'Authorization: Bearer s3cret' \
  http://localhost:3000/render ...
```

### X-API-Key header

```bash
curl -H 'X-API-Key: s3cret' \
  http://localhost:3000/render ...
```

### Query parameter

Useful for `<img>` embeds where you can't set headers.

```
http://localhost:3000/render?api_key=s3cret&chart=...
```

## Public endpoints

Even with `API_KEY` set:

- `GET /health` — liveness probe, always public
- `GET /examples` — built-in gallery page, always public

The gallery embeds `<img>` tags that hit `/render`, so opening the
gallery *does* require the key to see actual charts. The page itself
renders regardless.

## What to do when the key is missing / wrong

The server returns `401 Unauthorized`. No body. Clients should
re-request with a valid key.

## Recommended setup

For anything beyond local dev:

1. Put chartjs2img behind a reverse proxy (nginx, Caddy, a CDN) that
   also handles TLS.
2. Set `API_KEY` to a long random string. Rotate periodically.
3. Pass the key server-side; don't ship it to browsers.
4. Optionally, lock the bind address to `127.0.0.1` and let the proxy
   be the only public entry point.
