---
title: 認証
description: chartjs2img HTTP サーバーの任意 API キー認証 — 3 種類のヘッダ／クエリ渡し、各エンドポイントが認証を要するか。
---

# 認証

API キー認証は**任意**です。無効化されている場合（既定）は全
エンドポイントを匿名で叩けます。有効化すると `/render`、
`/cache/:hash`、`/examples` は鍵が必要になり、`/health` は公開
のまま残ります（liveness probe が壊れないように）。

## 有効化

以下のどちらかで設定します。

```bash
# CLI フラグ
chartjs2img serve --api-key s3cret

# 環境変数
API_KEY=s3cret chartjs2img serve
```

どちらでも動作します。両方設定された場合は CLI フラグが優先です。

## 鍵の渡し方

クライアントは 3 通りから選べます。呼び出し側に合わせてどれでも
使えます。

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

ヘッダを設定できない `<img>` 埋め込み用途に便利です。

```
http://localhost:3000/render?api_key=s3cret&chart=...
```

## 公開 vs 認証エンドポイント

| エンドポイント       | `API_KEY` 未設定 | `API_KEY` 設定時    |
| -------------------- | ---------------- | ------------------- |
| `POST /render`       | 公開             | 鍵必須              |
| `GET /render`        | 公開             | 鍵必須              |
| `GET /cache/:hash`   | 公開             | 鍵必須              |
| `GET /examples`      | 公開             | **鍵必須**          |
| `GET /health`        | 公開             | 公開                |

`/examples` が鍵必須になるのは、ページが後続の `/render` 呼び
出し用に鍵を HTML に埋め込むためです。未認証のまま公開すると
`/examples` を取得した誰でも鍵を抜けてしまいます。このゲートは
バージョン 0.3 で厳格化されたもので、それ以前は `API_KEY` を
設定しても `/examples` が公開のままでした。

## 鍵が足りない／誤っているとき

サーバーは `401 Unauthorized` を JSON ボディ付きで返します。

```json
{ "error": "Unauthorized" }
```

鍵が「欠落」なのか「誤り」なのかは区別せず、ヒントも漏らしません。

## 推奨構成

ローカル開発を越える運用では:

1. chartjs2img をリバースプロキシ（nginx、Caddy、CDN）の後ろに
   置き、TLS は前段で終端します。
2. `API_KEY` を長めのランダム文字列に設定。定期ローテーション。
3. 鍵はサーバー間で渡し、ブラウザに送らないようにします。
4. 必要に応じてバインドを `127.0.0.1` にし、プロキシだけを公開
   エントリーポイントにします。
