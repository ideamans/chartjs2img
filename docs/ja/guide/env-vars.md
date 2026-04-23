---
title: 環境変数
description: chartjs2img の全環境変数 - ポート、ホスト、認証、同時実行数、キャッシュ設定、ページタイムアウト。
---

# 環境変数

全実行時設定は環境変数で上書きできます。Docker、Kubernetes、CI、systemd
で便利です。

| 変数                      | 既定値       | 説明                                                  |
| ------------------------- | ------------ | ----------------------------------------------------- |
| `PORT`                    | `3000`       | HTTP サーバーポート                                   |
| `HOST`                    | `0.0.0.0`    | HTTP サーバーバインドアドレス                         |
| `API_KEY`                 | *(なし)*     | このトークンで認証を有効化。[認証](./auth) を参照。   |
| `CONCURRENCY`             | `8`          | 同時レンダー上限。超過分はキュー待ち                  |
| `CACHE_MAX_ENTRIES`       | `1000`       | メモリ内キャッシュエントリの上限 (LRU)                |
| `CACHE_TTL_SECONDS`       | `3600`       | キャッシュエントリの生存時間                           |
| `PAGE_TIMEOUT_SECONDS`    | `60`         | 孤児タブリーパ。これより長く掛かるレンダリングは強制終了 |
| `CHROMIUM_PATH`           | *(なし)*     | Chromium バイナリの明示パス。検出チェーンより最優先。[インストール](./install) を参照 |

## 設定方法

### シェル

```bash
export PORT=8080
export CONCURRENCY=4
chartjs2img serve
```

### Docker

```bash
docker run -p 8080:8080 \
  -e PORT=8080 \
  -e API_KEY=s3cret \
  -e CONCURRENCY=4 \
  chartjs2img
```

### docker-compose

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
      PAGE_TIMEOUT_SECONDS: 30
```

### systemd

```ini
[Service]
Environment=PORT=3000
Environment=API_KEY=s3cret
Environment=CONCURRENCY=8
ExecStart=/usr/local/bin/chartjs2img serve
```

## チューニングの指針

### `CONCURRENCY`

CPU コア数に合わせる。アクティブなレンダリングは 1 タブ + メモリ
(約 50〜150 MB) を使います。高すぎると OOM やページタイムアウト、
低すぎるとクライアントがキューで待ちます。

目安:

- 2 コア → `CONCURRENCY=2`
- 8 コア → `CONCURRENCY=6` (I/O + OS 用の余裕)
- 32 コア → `CONCURRENCY=16` (CPU ではなくメモリがボトルネックに)

`GET /health` → `renderer.concurrency.pending` を見て判断。

### `CACHE_MAX_ENTRIES` / `CACHE_TTL_SECONDS`

同一リクエストが多ければキャッシュ効率が高い。`X-Cache-Hit: true/false`
をサンプリングしてプロファイル:

- 約 50 種類のチャートを何度も見るダッシュボード → 大きめキャッシュ・長い TTL。
- アドホックな一回限りのレンダリング → 小さめキャッシュ・短い TTL。
- ステートレス水平スケールアウト → 内部キャッシュをバイパス
  (`CACHE_MAX_ENTRIES=0`) して CDN に任せる。

### `PAGE_TIMEOUT_SECONDS`

Chart.js がハングしたケース (無限 `animation` 再帰、外部プラグインの
読み込み詰まり) をカバーします。本当に遅いチャートがある時だけ上げる。
