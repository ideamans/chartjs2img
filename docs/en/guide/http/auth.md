---
title: Authentication
description: Optional API-key authentication for the chartjs2img HTTP server — three header and query-string variants, and which endpoints need it.
---

# Authentication

API key authentication is **optional**. When disabled (the default),
all endpoints are reachable anonymously. When enabled, `/render`,
`/cache/:hash`, and `/examples` require the key; `/health` stays
public so liveness probes keep working.

## Enabling

Pick one of the two:

```bash
# CLI flag
chartjs2img serve --api-key s3cret

# Environment variable
API_KEY=s3cret chartjs2img serve
```

Either is fine; the CLI flag wins if both are set.

## Passing the key

Clients may pass the key in three ways. Pick whichever fits your
call site; the server accepts all three.

### `Authorization: Bearer`

```bash
curl -H 'Authorization: Bearer s3cret' \
  http://localhost:3000/render ...
```

### `X-API-Key`

```bash
curl -H 'X-API-Key: s3cret' \
  http://localhost:3000/render ...
```

### `?api_key=`

Useful for `<img>` embeds where you can't set headers.

```
http://localhost:3000/render?api_key=s3cret&chart=...
```

## Public vs. auth-gated endpoints

| Endpoint            | Without `API_KEY` | With `API_KEY`     |
| ------------------- | ----------------- | ------------------ |
| `POST /render`      | Public            | Requires key       |
| `GET /render`       | Public            | Requires key       |
| `GET /cache/:hash`  | Public            | Requires key       |
| `GET /examples`     | Public            | **Requires key**   |
| `GET /health`       | Public            | Public             |

`/examples` is gated when `API_KEY` is set because the page embeds
the key in its HTML for the subsequent `/render` calls. Leaving the
page public would leak the key to any fetch of `/examples`. This was
tightened in version 0.3 — versions before that used to leave
`/examples` open even with `API_KEY` set.

## What to do when the key is missing / wrong

The server returns `401 Unauthorized` with a JSON body:

```json
{ "error": "Unauthorized" }
```

No hint is leaked about whether the key was missing or merely wrong.

## Recommended setup

For anything beyond local dev:

1. Put chartjs2img behind a reverse proxy (nginx, Caddy, a CDN) that
   also handles TLS.
2. Set `API_KEY` to a long random string. Rotate periodically.
3. Pass the key server-side; don't ship it to browsers.
4. Optionally, bind to `127.0.0.1` and let the proxy be the only
   public entry point.
