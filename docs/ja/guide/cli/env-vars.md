---
title: 環境変数 (CLI)
description: chartjs2img CLI レンダリングに関連する環境変数 — Chromium 検出、レンダリングタイムアウト、ワンショット用のキャッシュ設定。
---

# 環境変数 (CLI)

`chartjs2img render` を実行すると、いくつかの環境変数を読みます。
主な用途は Chromium の場所指定とレンダリング時間の調整です。
HTTP サーバー固有の変数（`PORT`、`HOST`、`API_KEY`）は CLI では
効きません。詳しくは
[HTTP サーバー → 環境変数](../http/env-vars) を参照してください。

| 変数                        | 既定値      | 説明                                                                                         |
| --------------------------- | ----------- | -------------------------------------------------------------------------------------------- |
| `CHROMIUM_PATH`             | *(なし)*    | Chromium / Chrome バイナリへの明示パス。自動検出より優先されます。                            |
| `PLAYWRIGHT_BROWSERS_PATH`  | *(なし)*    | 検出時にスキャンする Playwright キャッシュディレクトリを上書きします。                         |
| `MAX_RENDER_TIME_SECONDS`   | `30`        | 1 件のレンダリング上限（`page.goto` と `waitForFunction` の timeout）。                         |
| `PAGE_TIMEOUT_SECONDS`      | *(導出)*    | セーフティネット強制クローズの上書き。既定: `MAX_RENDER_TIME_SECONDS * 2 + 10s`。               |
| `CONCURRENCY`               | `8`         | ワンショット `render` では無関係。ただし `chartjs2img examples` のバッチモードでは使用されます。 |

キャッシュ関連（`CACHE_MAX_ENTRIES`、`CACHE_TTL_SECONDS`）も起動時
に読まれますが、ワンショット呼び出しではプロセスの寿命より長く
キャッシュが残らないため、実質的にサーバー固有の設定です。

## 設定方法

### 1 コマンド単位

```bash
CHROMIUM_PATH=/usr/bin/chromium-browser chartjs2img render -i chart.json -o chart.png
```

### シェル単位

```bash
export CHROMIUM_PATH=/usr/bin/chromium-browser
export MAX_RENDER_TIME_SECONDS=60

chartjs2img render -i chart.json -o chart.png
```

### CI / systemd

ジョブ定義の環境変数として設定します。GitHub Actions 例:

```yaml
- name: Render charts
  env:
    CHROMIUM_PATH: /usr/bin/chromium-browser
    MAX_RENDER_TIME_SECONDS: 60
  run: chartjs2img render -i chart.json -o chart.png
```

## チューニング指針

### `CHROMIUM_PATH`

自動検出が見つけられない Chromium を指定する必要がある場合に使い
ます。典型例は Linux ARM64 で、Chrome for Testing の自動ダウンロード
が linux-arm64 向けに提供されていないためです。
[インストール → Linux ARM64](../install#linux-arm64-chromium-の手動インストールが必須)
を参照。

### `MAX_RENDER_TIME_SECONDS`

本当に時間が必要なケース（巨大な force-directed graph、CDN コールド
スタートなど）で引き上げてください。既定の 30 秒は同梱サンプルの
何倍も余裕があります。

### `PAGE_TIMEOUT_SECONDS`

実際にはハングしていないのに `Safety net fired after Xms` 警告が
stderr に出る場合のみ調整してください。その場合は導出値がタイトに
すぎるので、この値を上げる（あるいは `MAX_RENDER_TIME_SECONDS` を
上げる — 自動で再導出されます）のが適切です。

## 関連

- [インストール](../install) — Chromium 検出順と linux-arm64 注意。
- [エラーフィードバック](./error-feedback) — stderr の警告の読み方。
