---
title: CLI レンダリング
description: chartjs2img の CLI で Chart.js 設定を PNG / JPEG にレンダリング。フラグ、入力形式、ワンショット用途の定番パターンを網羅。
---

# CLI レンダリング

`render` サブコマンドは Chart.js 設定 JSON を受け取って画像を書き出し
ます。chartjs2img のメインの使い方で、1 件の入力 JSON から 1 枚の
画像を得る用途にぴったりです。CI、Makefile ターゲット、レポート生成
スクリプト、アドホックな単発呼び出しなどに向いています。

```bash
chartjs2img render [options]
```

まだインストールしていない場合は [クイックスタート](../) を参照
してください。

## 利用パターン

### 標準入力から

デフォルトの動作。JSON を stdin に流し、画像は `-o` で書き出します。

```bash
echo '{"type":"bar","data":{"labels":["A","B","C"],"datasets":[{"data":[1,2,3]}]}}' \
  | chartjs2img render -o chart.png
```

### ファイルから

```bash
chartjs2img render -i chart.json -o chart.png
```

### 標準出力へ

`-o` を省略（または `-o -`）すると、バイナリ画像が stdout に
書き出されます。`identify`、`magick`、あるいは HTTP POST への
直接パイプに便利です。

```bash
chartjs2img render -i chart.json > chart.png

# ImageMagick で後処理にパイプ
chartjs2img render -i chart.json | magick - -resize 640x jpg:chart.jpg
```

### JPEG 出力

```bash
chartjs2img render -i chart.json -o chart.jpg -f jpeg -q 85
```

### サイズ・DPR・背景色の変更

```bash
chartjs2img render -i chart.json -o wide.png -w 1200 -h 400
chartjs2img render -i chart.json -o retina.png --device-pixel-ratio 3
chartjs2img render -i chart.json -o transparent.png --background-color transparent
```

## 入力形式

CLI の入力は Chart.js 設定そのもの（ラッパーなし）です。HTTP ボディ
では `chart` フィールドで包む点と異なります。

```json
{
  "type": "bar",
  "data": {
    "labels": ["Jan", "Feb", "Mar"],
    "datasets": [
      { "label": "Sales", "data": [12, 19, 3], "backgroundColor": "rgba(54,162,235,0.7)" }
    ]
  },
  "options": {
    "plugins": {
      "title": { "display": true, "text": "Monthly Sales" }
    }
  }
}
```

::: warning JSON のみ — 関数値は静かに破棄されます
設定はヘッドレスブラウザへ渡る際に `JSON.stringify` を通過します。
関数値・シンボル・`undefined` はここで落ちるため、
`formatter: (ctx) => ...` のようなコールバック、tooltip コールバック、
scale tick コールバックは届きません。静的な値を使ってください。
:::

各プラグインが追加する `type` やオプションは
[同梱プラグイン](../plugins) を参照、または `chartjs2img llm` で LLM
向けリファレンス全文を出力できます。

## フラグ

| フラグ                        | 既定値   | 説明                                          |
| ----------------------------- | -------- | --------------------------------------------- |
| `-i, --input <file>`          | stdin    | 入力 JSON ファイル、または `-` で stdin       |
| `-o, --output <file>`         | stdout   | 出力画像ファイル、または `-` で stdout        |
| `-w, --width <px>`            | `800`    | キャンバス幅                                  |
| `-h, --height <px>`           | `600`    | キャンバス高さ                                |
| `--device-pixel-ratio <n>`    | `2`      | Retina スケール係数                           |
| `--background-color <color>`  | `white`  | CSS カラー、または `transparent`              |
| `-f, --format <fmt>`          | `png`    | `png` または `jpeg`                           |
| `-q, --quality <0-100>`       | `90`     | JPEG の品質                                   |

## その他のサブコマンド

### `chartjs2img examples`

組み込みサンプル全てを指定ディレクトリへレンダリングします。新しい
プラグインや Chromium バージョンの煙テストに便利です。

```bash
chartjs2img examples -o ./out
chartjs2img examples -o ./out -f jpeg -q 80
```

| フラグ                  | 既定値        | 説明              |
| ----------------------- | ------------- | ----------------- |
| `--outdir, -o <dir>`    | `./examples`  | 出力ディレクトリ  |
| `-f, --format <fmt>`    | `png`         | `png` / `jpeg`    |
| `-q, --quality <0-100>` | `90`          | JPEG 品質         |

### `chartjs2img llm`

Chart.js とプラグインの全リファレンスを Markdown で出力。LLM の
コンテキストウィンドウへ流し込む想定です。

```bash
chartjs2img llm > reference.md
chartjs2img llm | pbcopy                              # macOS クリップボード
chartjs2img llm | llm -s "Generate a stacked bar..."  # LLM CLI へパイプ
```

### `chartjs2img help` / `--help`

全サブコマンド・全フラグ・全環境変数を含むヘルプを表示します。

### `chartjs2img version` / `--version`

バージョン番号を表示します。

## 終了コード

| コード | 意味                                              |
| ------ | ------------------------------------------------- |
| `0`    | 成功                                              |
| `1`    | I/O 失敗、または Chromium 起動失敗                |
| `2`    | 引数エラー（値取りフラグに値がない等）            |

Chart.js ランタイムのエラー（`type` の typo、データセット形状
ミスマッチなど）は**非ゼロ終了しません**。stderr に出力されます。
[エラーフィードバック](./error-feedback) を参照。

## パフォーマンス補足

- Chromium はプロセス内の初回レンダリング時に起動し、同一プロセス
  内の後続レンダリングで再利用されます。ワンショット CLI 呼び出し
  はこの起動コスト（約 300 ms）を毎回支払います。
- 多数のチャートをバッチレンダリングするなら、同一ブラウザを使い
  回す `chartjs2img examples -o ./out` か、
  [HTTP サーバー](../http/) を立てて各チャートを POST するほうが
  効率的です。

## 次はどこへ

- **[環境変数](./env-vars)** — Chromium 検出、レンダリング
  タイムアウト、キャッシュ動作を CLI 向けに調整。
- **[エラーフィードバック](./error-feedback)** — Chart.js の警告・
  エラーが stderr にどう出るか。
- **[同梱プラグイン](../plugins)** — 追加セットアップなしで使える
  12 個の Chart.js プラグイン。
