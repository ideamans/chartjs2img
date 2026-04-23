---
title: インストール
description: chartjs2img をソースから、単一バイナリとして、または Docker で導入する方法。Chromium 検出の挙動と Linux ARM64 に関する注意も含みます。
---

# インストール

chartjs2img は Bun プロジェクトです。ソースから直接実行、単一バイナリに
コンパイル、または Docker イメージの 3 通りで動かせます。

## 方法 A — ソースから実行 (開発時に推奨)

```bash
git clone https://github.com/ideamans/chartjs2img
cd chartjs2img
bun install
bun run dev              # HTTP サーバーが :3000 で起動
```

Bun は TypeScript を直接実行できるため、開発時にビルドステップは不要です。

## 方法 B — 単一バイナリ (配布向け)

スタンドアロンな実行ファイルにコンパイル:

```bash
bun run build
# または直接:
bun build src/index.ts --compile --outfile chartjs2img
```

`./chartjs2img` が生成されます。`PATH` の通ったディレクトリに移動するだけ:

```bash
mv chartjs2img ~/.local/bin/
chartjs2img serve --port 3000
```

このバイナリは **Bun や Node.js に実行時依存しません**。Chromium は
初回起動時に見つからなければ自動ダウンロードされます。

## 方法 C — Docker

```bash
docker build -t chartjs2img .
docker run -p 3000:3000 chartjs2img
```

Docker イメージに含まれるもの:

- Bun ランタイム
- Puppeteer 互換の Chromium (ヘッドレス)
- Noto Sans CJK フォント (日本語・中国語・韓国語 — tofu 化しない)

Compose 例・環境変数設定は [Docker](./docker) を参照。

## Chromium / Chrome の検出

初回レンダー時、chartjs2img は以下の順でブラウザを探します:

1. **`CHROMIUM_PATH`** 環境変数 — 明示的な上書きが最優先。
2. **Puppeteer ブラウザキャッシュ** — `~/.cache/puppeteer/` 等。
3. **システムインストール済みの Chrome / Chromium** — `/Applications/Google Chrome.app`, `/usr/bin/google-chrome` 等。
4. **自動ダウンロード** — [Chrome for Testing](https://googlechromelabs.github.io/chrome-for-testing/) をユーザーキャッシュに取得 (sudo 不要)。

自動ダウンロードは **macOS (x64/arm64)**、**Windows (x64/x86)**、**Linux (x64)** で利用できます。

### Linux ARM64 (手動インストールが必要)

Chrome for Testing は linux-arm64 向けバイナリを提供していません。
Chromium を手動で入れて `CHROMIUM_PATH` を指定してください:

```bash
# Debian / Ubuntu
sudo apt install chromium-browser   # または `chromium`

# 現在のシェルで:
export CHROMIUM_PATH=/usr/bin/chromium-browser
chartjs2img serve
```

systemd ユニットや Docker 実行環境に設定して永続化することもできます。

## インストールの確認

```bash
chartjs2img --help         # 使用法の表示
chartjs2img llm | head     # LLM 向けリファレンス (冒頭数行)
```

フルスモークテスト:

```bash
echo '{"type":"bar","data":{"labels":["A","B"],"datasets":[{"data":[1,2]}]}}' \
  | chartjs2img render -o /tmp/hello.png
open /tmp/hello.png         # macOS; Linux なら xdg-open
```

動けば準備完了。[HTTP API](./http-api) や [CLI](./cli) に進みましょう。
