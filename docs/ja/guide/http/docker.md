---
title: Docker
description: chartjs2img HTTP サーバーを Docker で構築・運用 — 同梱 Chromium と Noto Sans CJK、docker-compose、リバースプロキシ例。
---

# Docker

Docker イメージは **HTTP サーバー** 用途を想定しています（1
コンテナ = 1 長期稼働サーバー、多数のクライアント）。ローカル
マシンで 1 枚のチャートを描画するだけなら、
[CLI](../cli/) のほうが軽量です（コンテナ不要）。

## ビルド

```bash
docker build -t chartjs2img .
```

イメージの内容:

- コンパイル済み `chartjs2img` バイナリ（Bun の `--compile` 出力）
- Chromium（事前インストール済み — 起動時の自動ダウンロード不要）
- **Noto Sans CJK** — 日本語・中国語・韓国語ラベルが豆腐化しない

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

全変数は [環境変数](./env-vars) を参照。

## docker-compose

```yaml
services:
  chartjs2img:
    build: .
    ports:
      - "3000:3000"
    environment:
      API_KEY: s3cret
      CONCURRENCY: 8
      CACHE_MAX_ENTRIES: 2000
      CACHE_TTL_SECONDS: 7200
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000/health"]
      interval: 30s
      timeout: 5s
      retries: 3
```

## リバースプロキシ経由

本番では TLS / レート制限 / ログのために nginx・Caddy・CDN を
前段に置くのが定番です。

### nginx

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
    # /cache/:hash は不変なのでプロキシバッファは無効化
    proxy_buffering off;
    # 稀に数秒かかるロングテールにも対応
    proxy_read_timeout 60s;
  }
}
```

### Caddy

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

ハッシュキャッシュは**メモリ内**のみです。コンテナ再起動で消えます
— クライアントにはキャッシュが温まるまで `X-Cache-Hit: false` が
返ります。

再起動を跨いで永続化が必要な場合:

- CDN をフロントに置いて `/cache/:hash` をエッジキャッシュ
  （不変コンテンツのベストプラクティス）。
- 外部ストアにレンダリング画像を書き出し、独自キャッシュレイヤーで
  chartjs2img の内蔵キャッシュを迂回。

## Linux ARM64

Docker イメージは既定で linux/amd64 向けにビルドされます。
linux/arm64（Apple Silicon、AWS Graviton）が必要な場合は buildx を
使います。

```bash
docker buildx build --platform linux/arm64 -t chartjs2img .
```

ベースイメージは Debian のパッケージ版 Chromium を利用するため、
linux-arm64 でも動作します（自動ダウンロード経路とは異なり）。
Docker を使わない linux-arm64 の場合は
[インストール → Linux ARM64](../install#linux-arm64-chromium-の手動インストールが必須)
を参照。

## トラブルシュート

### コンテナは起動するがレンダリングがタイムアウト

`docker logs <container>` を確認。Chromium 起動エラーが典型です。
よくある対処:

- 共有メモリを増やす: `--shm-size=1g`
- コンテナ内ユーザーが `/tmp`（Chromium のスクラッチ領域）に書き
  込めることを確認

### 日本語 / CJK テキストが豆腐

付属の Dockerfile では起きません（Noto Sans CJK を組み込み済み）。
Dockerfile を独自に書き換えた場合は、明示的にフォントをインストール
してください。

```dockerfile
RUN apt-get update && apt-get install -y \
  fonts-noto-cjk fonts-noto-color-emoji \
  && rm -rf /var/lib/apt/lists/*
```

### ビルドは通るが実行時に Chromium が見つからない

`CHROMIUM_PATH` を明示してください。

```bash
docker run -e CHROMIUM_PATH=/usr/bin/chromium chartjs2img
```
