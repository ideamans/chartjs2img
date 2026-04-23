---
title: インストール
description: chartjs2img をワンライナー、GitHub Releases、Docker、ソースからインストールする方法。Chromium 検出や Linux ARM64 の注意も含みます。
---

# インストール

最短は [クイックスタート](./) のワンライナー — `curl` から
`bash` へパイプするスクリプトが、お使いのプラットフォーム向けの
バイナリをダウンロードして `PATH` に配置します。このページでは
それ以外の方法として、インストール用ランディングページ、GitHub
Releases からの手動ダウンロード、Docker、ソースビルドを紹介します。

## インストール用ランディングページ

インストールスクリプトは専用ページから配信されています。

**<https://bin.ideamans.com/oss/chartjs2img>**

::: tip
ランディングページ自体は日本語ですが、インストールコマンド自体は
どのロケールでもそのまま動作します。
:::

各プラットフォーム向けに最新版スクリプトを提供しています。

| プラットフォーム     | コマンド                                                             |
|----------------------|----------------------------------------------------------------------|
| macOS / Linux        | `curl -fsSL https://bin.ideamans.com/install/chartjs2img.sh \| bash` |
| Windows (PowerShell) | `irm https://bin.ideamans.com/install/chartjs2img.ps1 \| iex`        |

デフォルトのインストール先:

- **Linux / macOS** — システム全体のディレクトリ
  （通常は `/usr/local/bin`）。`--install-dir $HOME/bin` でユーザー
  ローカルに変更可能:
  ```sh
  curl -fsSL https://bin.ideamans.com/install/chartjs2img.sh | bash -s -- --install-dir "$HOME/bin"
  ```
- **Windows (管理者)** — `C:\Program Files\chartjs2img\chartjs2img.exe`
- **Windows (通常ユーザー)** — `%USERPROFILE%\bin\chartjs2img.exe`

カスタムディレクトリにインストールした場合は、そのパスが
`PATH` に含まれていることを確認してください。

## GitHub Releases (手動ダウンロード)

タグ付けされた各リリースでプラットフォーム別のアーカイブを配布
しています。ダウンロード・展開・任意の場所への配置を手動で行います。

**<https://github.com/ideamans/chartjs2img/releases/latest>**

| プラットフォーム      | アセット                                       |
|-----------------------|-----------------------------------------------|
| Linux x64             | `chartjs2img_<version>_linux_amd64.tar.gz`    |
| Linux ARM64           | `chartjs2img_<version>_linux_arm64.tar.gz`    |
| macOS (Intel)         | `chartjs2img_<version>_darwin_amd64.tar.gz`   |
| macOS (Apple Silicon) | `chartjs2img_<version>_darwin_arm64.tar.gz`   |
| Windows x64           | `chartjs2img_<version>_windows_amd64.zip`     |

### Linux / macOS

```sh
VERSION=0.2.2
OS=linux       # または darwin
ARCH=amd64     # または arm64

curl -fsSL -o chartjs2img.tar.gz \
  "https://github.com/ideamans/chartjs2img/releases/download/v${VERSION}/chartjs2img_${VERSION}_${OS}_${ARCH}.tar.gz"

tar -xzf chartjs2img.tar.gz
sudo mv chartjs2img /usr/local/bin/
```

### Windows (PowerShell)

```powershell
$Version = "0.2.2"
$Url = "https://github.com/ideamans/chartjs2img/releases/download/v$Version/chartjs2img_${Version}_windows_amd64.zip"

Invoke-WebRequest $Url -OutFile chartjs2img.zip
Expand-Archive chartjs2img.zip -DestinationPath .
# chartjs2img.exe を PATH の通ったディレクトリ（例: %USERPROFILE%\bin）へ移動
```

## Docker (HTTP サーバーのみ)

chartjs2img を長期稼働の HTTP サービスとして動かす場合は、Docker
イメージをビルドまたは pull してください。Chromium と Noto Sans CJK
フォントがあらかじめ組み込まれているため、初回起動時の Chromium
ダウンロードや日本語/中国語/韓国語ラベルの豆腐化が起きません。

詳細は [HTTP サーバー → Docker](./http/docker) を参照。

## ソースからビルド

chartjs2img は [Bun](https://bun.sh) で動作します。Bun をインストール
してから:

```sh
git clone https://github.com/ideamans/chartjs2img
cd chartjs2img
bun install
bun run build        # ./chartjs2img をリポジトリ直下に生成
```

コンパイルせずにそのまま実行する場合（CLI の開発時に便利）:

```sh
bun run src/index.ts render -i chart.json -o chart.png
```

## Chromium / Chrome 検出

初回レンダリング時、chartjs2img は以下の順にブラウザを探します:

1. **`CHROMIUM_PATH`** 環境変数 — 明示的な上書きが最優先。
2. **Puppeteer のブラウザキャッシュ** — `~/.cache/puppeteer/` など。
3. **システムインストールされた Chrome / Chromium** —
   `/Applications/Google Chrome.app`、`/usr/bin/google-chrome` など。
4. **自動ダウンロード** —
   [Chrome for Testing](https://googlechromelabs.github.io/chrome-for-testing/)
   をユーザーキャッシュディレクトリへダウンロード（sudo 不要）。

自動ダウンロードに対応しているのは **macOS (x64 / arm64)**、
**Windows (x64)**、**Linux (x64)** です。

### Linux ARM64 (Chromium の手動インストールが必須)

Chrome for Testing は linux-arm64 向けビルドを**配布していません**。
ご自身で Chromium をインストールして `CHROMIUM_PATH` を設定して
ください。

```sh
# Debian / Ubuntu
sudo apt install chromium-browser   # または `chromium`

export CHROMIUM_PATH=/usr/bin/chromium-browser
chartjs2img render -i chart.json -o chart.png
```

systemd の unit ファイルや `docker run` の環境変数に含めれば永続化
できます。

## アップグレード

[クイックスタート](./) のワンライナーを再実行するか、Releases から
最新版を取得してください。スクリプトは冪等で、既存バイナリを置き
換えるだけです。

## アンインストール

インストール先のバイナリを削除するだけです
（`/usr/local/bin/chartjs2img`、`$HOME/bin/chartjs2img`、Windows の
インストールディレクトリ）。インストーラが書き込むのはこの
バイナリのみです。ランタイムで自動ダウンロードされた Chromium は
`~/Library/Caches/ms-playwright/` (macOS)、
`~/.cache/ms-playwright/` (Linux)、
`%LOCALAPPDATA%\ms-playwright\` (Windows) にキャッシュされるので、
ディスク容量 (~250 MB) を戻したい場合はこのディレクトリを削除してください。
