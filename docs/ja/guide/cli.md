---
title: CLI
description: chartjs2img CLI の全サブコマンド - serve、render、examples、llm、help - とオプション。
---

# CLI

`chartjs2img` バイナリは 4 つの動作モードとヘルプ画面を持ちます。
ソース実行時は `bun run src/index.ts` を前置、コンパイル済みバイナリ
または PATH 設定済みの場合は直接 `chartjs2img` で呼び出します。

```bash
chartjs2img <command> [options]
```

## `chartjs2img serve`

HTTP サーバーを起動。エンドポイントは [HTTP API](./http-api) を参照。

```bash
chartjs2img serve --port 8080 --api-key secret
```

| フラグ             | 既定値   | 環境変数    | 説明                          |
| ------------------ | -------- | ----------- | ----------------------------- |
| `--port, -p`       | `3000`   | `PORT`      | TCP 待ち受けポート            |
| `--host`           | `0.0.0.0` | `HOST`     | バインドアドレス              |
| `--api-key`        | *(なし)* | `API_KEY`   | このトークンで認証を有効化    |

同時実行数、キャッシュ、ページタイムアウトは環境変数でのみ設定します —
[環境変数](./env-vars) を参照。

## `chartjs2img render`

JSON から 1 枚だけチャートを作って画像を書き出す。CI、Makefile、
ワンショットスクリプトに最適。

```bash
# ファイルから
chartjs2img render -i chart.json -o chart.png

# stdin から (既定)
echo '{"type":"bar","data":{"labels":["A","B"],"datasets":[{"data":[1,2]}]}}' \
  | chartjs2img render -o chart.png

# stdout に
chartjs2img render -i chart.json > chart.png

# JPEG とサイズ指定
chartjs2img render -i chart.json -o chart.jpg -w 1200 -h 400 -f jpeg -q 85
```

| フラグ                         | 既定値      | 説明                                                  |
| ------------------------------ | ----------- | ----------------------------------------------------- |
| `-i, --input <file>`           | stdin       | 入力 JSON ファイル。`-` で stdin 明示                 |
| `-o, --output <file>`          | stdout      | 出力画像ファイル。`-` で stdout 明示                  |
| `-w, --width <px>`             | `800`       | キャンバス幅                                          |
| `-h, --height <px>`            | `600`       | キャンバス高さ                                        |
| `--device-pixel-ratio <n>`     | `2`         | Retina スケール係数                                   |
| `--background-color <color>`   | `white`     | CSS カラーまたは `transparent`                        |
| `-f, --format <fmt>`           | `png`       | `png` / `jpeg` / `webp`                               |
| `-q, --quality <0-100>`        | `90`        | JPEG / WebP 品質                                      |

**`render` の入力形状** は Chart.js 設定そのもの — 外側の `chart`
ラッパーは不要 (HTTP ボディとは異なる点)。CLI にパイプすると、
JSON はそのままチャート設定として解釈されます。

Chart.js のエラー・警告は stderr に出力されます。
[エラーフィードバック](./error-feedback) を参照。

## `chartjs2img examples`

組み込みサンプル 18 点を全て指定ディレクトリに書き出します。
新しいプラグインや新しいブラウザで疎通確認するときに便利。

```bash
chartjs2img examples -o ./out
# JPEG で
chartjs2img examples -o ./out -f jpeg -q 80
```

| フラグ                   | 既定値         | 説明                |
| ------------------------ | -------------- | ------------------- |
| `--outdir, -o <dir>`     | `./examples`   | 出力ディレクトリ    |
| `-f, --format <fmt>`     | `png`          | `png` / `jpeg`      |
| `-q, --quality <0-100>`  | `90`           | JPEG 品質           |

サンプル一覧は `src/examples.ts` に定義されています。

## `chartjs2img llm`

Chart.js + 全プラグインのリファレンスを Markdown で出力。LLM の
コンテキストウィンドウに流し込むために設計されています。

```bash
chartjs2img llm | pbcopy                              # macOS クリップボードへ
chartjs2img llm > reference.md                        # ファイルに保存
chartjs2img llm | llm -s "円グラフを…"                 # LLM CLI にパイプ
```

出力は約 1400 行の構造化された Markdown — 利用ガイド、Chart.js コア、
全プラグインのオプション表・JSON 例、注意事項 が含まれます。

各モジュールの内容は `src/llm-docs/<module>.ts` に置かれ、
集約器は `src/llm-docs/index.ts`。拡張方法は開発者ガイドを参照。

## `chartjs2img help` / `--help`

使用法バナーを出力: 全コマンド、全フラグ、全環境変数。

## `chartjs2img version` / `--version`

`src/version.ts` のバージョンを出力。

## 終了コード

- `0` — 成功
- 非 0 — 引数エラー、I/O 失敗、または Chromium 起動失敗

Chart.js の実行時エラー (未知の `chart.type`、プラグイン不足など) は
**終了コードを 0 以外にしません**。代わりに `X-Chart-Messages`
ヘッダー (HTTP) または stderr (CLI) で通知されます。
[エラーフィードバック](./error-feedback) を参照。
