---
title: クイックスタート
description: chartjs2img の CLI と HTTP API を使って、1 分以内に初めての Chart.js チャートを PNG に描画します。
---

# クイックスタート

Chart.js のチャートを 1 分で PNG にします。chartjs2img は Chart.js の
設定 JSON を受け取り、ヘッドレス Chromium を介して画像を出力します。

2 通りの使い方があります。

- **HTTP API** — JSON を POST して画像を受け取る。長時間サービス向き。
- **CLI** — JSON をパイプして画像を出力する。ワンショット向き。

どちらも同じレンダラ、同じキャッシュ、同じプラグインを共有します。

## 前提条件

[Bun](https://bun.sh) をインストールしておきます。

```bash
# macOS / Linux
curl -fsSL https://bun.sh/install | bash

# シェルを再起動するか rc ファイルを読み直す
source ~/.zshrc   # または ~/.bashrc
```

確認:

```bash
bun --version
```

初回レンダー時に Chromium がユーザーキャッシュに**自動ダウンロード**されます
(約 250 MB)。linux-arm64 では自動ダウンロードに対応していないため、
Chromium を手動で導入し `CHROMIUM_PATH` を設定してください。詳細は
[インストール](./install) を参照。

## 1. 依存関係のインストール

```bash
git clone https://github.com/ideamans/chartjs2img
cd chartjs2img
bun install
```

## 2. HTTP サーバーの起動

```bash
bun run dev
```

次のような出力になります:

```
chartjs2img server listening on http://0.0.0.0:3000
  POST /render      - render chart from JSON body
  GET  /render      - render chart from query params
  GET  /cache/:hash - retrieve cached image
  GET  /examples    - examples gallery
  GET  /health      - health check + stats
```

## 3. 初めてのチャート

別のターミナルで:

```bash
curl -X POST http://localhost:3000/render \
  -H 'Content-Type: application/json' \
  -d '{
    "chart": {
      "type": "bar",
      "data": {
        "labels": ["1月", "2月", "3月", "4月"],
        "datasets": [{
          "label": "売上",
          "data": [12, 19, 3, 5],
          "backgroundColor": "rgba(54, 162, 235, 0.7)"
        }]
      }
    }
  }' \
  -o chart.png
```

`chart.png` を開いてください — これがサーバーでレンダリングした
最初の Chart.js チャートです。

## 4. CLI でも同じことを

同じエンジンがワンショット CLI として動きます:

```bash
echo '{"type":"bar","data":{"labels":["A","B","C"],"datasets":[{"data":[1,2,3]}]}}' \
  | bun run src/index.ts render -o chart.png
```

## 5. 組み込みサンプルを眺める

[http://localhost:3000/examples](http://localhost:3000/examples) を開くと、
18 種類のチャートがリアルタイムでレンダリングされます。各チャートから
ソース JSON にアクセスできるので、コピーして改造するのに便利です。

## 次は何を

- **[インストール](./install)** — リリースバイナリ、Chromium 検出、Docker。
- **[HTTP API](./http-api)** — 全エンドポイント・全レスポンスヘッダー。
- **[CLI](./cli)** — 全サブコマンド・全フラグ。
- **[同梱プラグイン](./plugins)** — そのまま使える 12 個の Chart.js プラグイン。
- **[エラーフィードバック](./error-feedback)** — Chart.js のエラーを API 経由で拾う方法。
- **[AI ガイド](/ja/ai/)** — Claude / Copilot / Cursor / 任意の MCP エージェントから chartjs2img を使う。
