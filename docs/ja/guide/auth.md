---
title: 認証
description: chartjs2img のオプションの API キー認証 - ヘッダーとクエリ文字列の 3 通りの渡し方、どのエンドポイントに適用されるか。
---

# 認証

API キー認証は **オプション** です。無効 (既定) の時、全エンドポイント
は匿名で到達できます。有効にすると、`/render` と `/cache/:hash` はキーを
要求し、`/health` と `/examples` は引き続き公開されます。

## 有効化

いずれか 1 つでよい:

```bash
# CLI フラグ
chartjs2img serve --api-key s3cret

# 環境変数
API_KEY=s3cret chartjs2img serve
```

両方設定すると CLI フラグが優先します。

## キーの渡し方

クライアントは 3 通りのいずれでも渡せます。呼び出し側の都合で選び、
サーバーは全てを受け入れます。

### Authorization ヘッダー (Bearer)

```bash
curl -H 'Authorization: Bearer s3cret' \
  http://localhost:3000/render ...
```

### X-API-Key ヘッダー

```bash
curl -H 'X-API-Key: s3cret' \
  http://localhost:3000/render ...
```

### クエリパラメーター

ヘッダーを設定できない `<img>` 埋め込みなどで便利。

```
http://localhost:3000/render?api_key=s3cret&chart=...
```

## 公開エンドポイント

`API_KEY` を設定しても、以下は常時公開:

- `GET /health` — liveness プローブ。常に公開。
- `GET /examples` — 組み込みギャラリー。常に公開。

ギャラリーは `<img>` タグで `/render` を叩くため、ギャラリーを開く行為
そのものは **キーを要求します** (実際のチャートを表示するため)。
ページ自体はキーなしでもレンダリングされます。

## キーが無い / 不正な場合

サーバーは `401 Unauthorized` を返します。ボディは空。クライアントは
正しいキーで再リクエストしてください。

## 推奨セットアップ

ローカル開発以外では:

1. chartjs2img の前段にリバースプロキシ (nginx、Caddy、CDN) を置き、
   TLS、レート制限、リクエストロギングを任せる。
2. `API_KEY` は長いランダム文字列に。定期ローテーションを推奨。
3. キーはサーバーサイドで渡す。ブラウザに流さない。
4. 可能ならバインドアドレスを `127.0.0.1` に固定し、公開入口をプロキシに限定する。
