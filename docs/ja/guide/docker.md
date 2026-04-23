---
title: Docker
description: Docker で chartjs2img をビルド・実行する。Noto Sans CJK と Chromium が同梱され、docker-compose レシピも掲載。
---

# Docker

## ビルド

```bash
docker build -t chartjs2img .
```

イメージに含まれるもの:

- Bun ランタイム
- Chromium (インストール済み、初回ダウンロード不要)
- **Noto Sans CJK** — 日本語・中国語・韓国語ラベルが正しく描画される
- コンパイル済みの `chartjs2img` バイナリ

## 実行

```bash
docker run -p 3000:3000 chartjs2img
```

設定付き:

```bash
docker run -p 3000:3000 \
  -e API_KEY=s3cret \
  -e CONCURRENCY=4 \
  -e CACHE_MAX_ENTRIES=2000 \
  -e CACHE_TTL_SECONDS=7200 \
  chartjs2img
```

全環境変数は [環境変数](./env-vars) を参照。

## docker-compose

```yaml
services:
  chartjs2img:
    build: .
    ports:
      - "3000:3000"
    environment:
      - API_KEY=s3cret
      - CONCURRENCY=8
      - CACHE_MAX_ENTRIES=2000
      - CACHE_TTL_SECONDS=7200
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000/health"]
      interval: 30s
      timeout: 5s
      retries: 3
```

## リバースプロキシの裏に置く

本番では TLS・レート制限・リクエストロギングのために nginx / Caddy /
CDN を前段に置きます。

### nginx の例

```nginx
upstream chartjs2img {
  server 127.0.0.1:3000;
}

server {
  listen 443 ssl;
  server_name charts.example.com;

  location / {
    proxy_pass http://chartjs2img;
    proxy_set_header Host $host;
    # プロキシでのキャッシュは不要 — /cache/:hash が既に不変
    proxy_buffering off;
    # 長めのレンダリングに備える
    proxy_read_timeout 60s;
  }
}
```

### Caddy の例

```
charts.example.com {
  reverse_proxy localhost:3000 {
    transport http {
      read_timeout 60s
    }
  }
}
```

## 永続化

ハッシュキャッシュは **メモリ内**。コンテナを再起動すると消えます —
クライアントは `X-Cache-Hit: false` を受け取り、再ウォームアップが始まるだけ。

再起動を跨いで永続化したい場合:

- 前段に CDN を置き `/cache/:hash` をエッジでキャッシュ (最推奨)。
- 自前のキャッシュレイヤーで PNG を永続ストレージに保存し、chartjs2img
  の内部キャッシュはバイパスする。

## Linux ARM64

Dockerfile は既定で linux/amd64 向け。Apple Silicon など linux/arm64 では
buildx で:

```bash
docker buildx build --platform linux/arm64 -t chartjs2img .
```

ベースイメージは Debian パッケージの Chromium を使うため linux-arm64 も
サポート (自動ダウンロード経路とは異なる)。Docker を使わない
linux-arm64 での注意事項は [インストール](./install) を参照。

## トラブルシューティング

### コンテナは起動するがレンダリングがタイムアウトする

`docker logs <container>` で Chromium 起動エラーを確認。よくある修正:

- 共有メモリを確保: `--shm-size=1g`
- コンテナ実行ユーザーに `/tmp` (Chromium の作業領域) への書き込み権限

### 日本語 / CJK テキストが豆腐に

提供の Dockerfile では起きないはず (Noto Sans CJK が組み込み)。
カスタマイズした場合:

```dockerfile
RUN apt-get update && apt-get install -y \
  fonts-noto-cjk fonts-noto-color-emoji \
  && rm -rf /var/lib/apt/lists/*
```

### イメージはビルドされたが実行時に Chromium が見つからない

`CHROMIUM_PATH` を明示:

```bash
docker run -e CHROMIUM_PATH=/usr/bin/chromium chartjs2img
```
