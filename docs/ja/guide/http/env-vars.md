---
title: 環境変数 (HTTP サーバー)
description: chartjs2img HTTP サーバーが読む全環境変数 — ポート、ホスト、認証、並行度、キャッシュ、レンダリングタイムアウト。
---

# 環境変数 (HTTP サーバー)

サーバーの全設定は環境変数で行えます。Docker / Kubernetes / CI /
systemd で扱いやすい形式です。CLI 固有の注意点がある変数
（`CHROMIUM_PATH` の自動インストール絡みなど）はサーバーでも
読むため重複掲載しています。CLI 側の詳細は
[CLI → 環境変数](../cli/env-vars) を参照してください。

| 変数                        | 既定値      | 説明                                                                                         |
| --------------------------- | ----------- | -------------------------------------------------------------------------------------------- |
| `PORT`                      | `3000`      | HTTP ポート                                                                                  |
| `HOST`                      | `0.0.0.0`   | バインドアドレス                                                                             |
| `API_KEY`                   | *(なし)*    | 認証を有効化するトークン。[認証](./auth) 参照。                                               |
| `CONCURRENCY`               | `8`         | 並行レンダリング上限。超過分はキューイング。                                                   |
| `CACHE_MAX_ENTRIES`         | `1000`      | メモリ内キャッシュの最大件数                                                                 |
| `CACHE_TTL_SECONDS`         | `3600`      | キャッシュ TTL                                                                                |
| `MAX_RENDER_TIME_SECONDS`   | `30`        | 1 件のレンダリング上限（`page.goto` と `waitForFunction` の timeout）                          |
| `PAGE_TIMEOUT_SECONDS`      | *(導出)*    | セーフティネット強制クローズの上書き。既定: `MAX_RENDER_TIME_SECONDS * 2 + 10s`。               |
| `CHROMIUM_PATH`             | *(なし)*    | Chromium バイナリへの明示パス。検出チェーンより優先。[インストール](../install) 参照。          |

## 設定方法

### シェル

```bash
export PORT=8080
export CONCURRENCY=4
export API_KEY=s3cret
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
      MAX_RENDER_TIME_SECONDS: 45
```

### systemd

```ini
[Service]
Environment=PORT=3000
Environment=API_KEY=s3cret
Environment=CONCURRENCY=8
ExecStart=/usr/local/bin/chartjs2img serve
```

## チューニング指針

### `CONCURRENCY`

使える CPU コアに合わせます。1 レンダリングにつき 1 ブラウザタブ
＋ 50-150 MB のメモリを使います。上げすぎると OOM やページ
タイムアウトが出て、下げすぎるとクライアントがキューで待ちます。

目安:

- 2 コア → `CONCURRENCY=2`
- 8 コア → `CONCURRENCY=6`（I/O と OS の余裕を残す）
- 32 コア → `CONCURRENCY=16`（CPU より先にメモリが律速）

`GET /health` の `renderer.concurrency.pending` を観察して、上限を
上げるか水平スケールするかを判断します。

### `CACHE_MAX_ENTRIES` / `CACHE_TTL_SECONDS`

同一リクエストは激安、多様なリクエストは効きにくい。
`X-Cache-Hit: true/false` を観察して判断。

- ~50 個のチャートを 1 日に何度も表示するダッシュボード → キャッシュ
  大きめ、TTL 長め。
- アドホックな one-off → キャッシュ小さめ、TTL 短め。
- ステートレス水平スケールアウト → `CACHE_MAX_ENTRIES=0` にして
  CDN 側でキャッシュ（[キャッシュ](./cache) 参照）。

### `MAX_RENDER_TIME_SECONDS`

本当に遅いレンダリング（巨大データ、CDN コールドスタート）がある
ときのみ上げてください。止まったチャートを早期失敗させたいなら
下げます。

### `PAGE_TIMEOUT_SECONDS`

セーフティネットは、render の finally が何らかの理由で走らなかった
場合にのみ発火します。導出デフォルトを上書きする必要はまずありま
せん。サーバーログに `Safety net fired after Xms` が出ていて実際は
ハングしていないなら、レンダラーのバグなので issue を立ててください。

## 関連

- [CLI → 環境変数](../cli/env-vars) — ワンショット `render` と重複
  する変数の CLI 側の注意点。
- [認証](./auth) — `API_KEY` の使い方。
- [キャッシュ](./cache) — `CACHE_MAX_ENTRIES` と
  `CACHE_TTL_SECONDS` の挙動。
