---
title: クイックスタート
description: chartjs2img バイナリをインストールして 1 分以内に最初の Chart.js チャートを PNG にレンダリングします。
---

# クイックスタート

`chartjs2img` バイナリをインストールし、1 分以内に最初のチャートを
レンダリングします。リモートスクリプトをシェルに流し込みたくない
場合は [インストール](./install) の手動手順を参照してください。

## インストール

お使いの OS 向けコマンドを選択してください。どちらのスクリプトも
`chartjs2img` を自動的に `PATH` に配置します。

### macOS / Linux

```sh
curl -fsSL https://bin.ideamans.com/install/chartjs2img.sh | bash
```

### Windows (PowerShell)

```powershell
irm https://bin.ideamans.com/install/chartjs2img.ps1 | iex
```

### 動作確認

```sh
chartjs2img --help
```

使い方の表示が出れば OK です。`chartjs2img: command not found` と
なる場合は新しいシェルを開く（`PATH` 更新が反映されます）か、
[インストール](./install) を参照してください。

初回レンダリング時、Chromium がユーザーキャッシュへ
**自動ダウンロード** されます（約 250 MB）。linux-arm64 では
自動ダウンロードが使えないため、ディストリビューションから
Chromium をインストールして `CHROMIUM_PATH` を設定してください。
詳細は [インストール](./install) を参照。

## 最初のチャートをレンダリング

Chart.js 設定の 1 行 JSON をそのまま `chartjs2img` に流し込みます。
`render` コマンドは標準入力から JSON を読み、`-o` で PNG を出力します。

### macOS / Linux

```sh
echo '{"type":"bar","data":{"labels":["Jan","Feb","Mar"],"datasets":[{"label":"Sales","data":[12,19,3],"backgroundColor":"rgba(54,162,235,0.7)"}]}}' \
  | chartjs2img render -o hello.png
```

### Windows (PowerShell)

```powershell
'{"type":"bar","data":{"labels":["Jan","Feb","Mar"],"datasets":[{"label":"Sales","data":[12,19,3],"backgroundColor":"rgba(54,162,235,0.7)"}]}}' `
  | chartjs2img render -o hello.png
```

`hello.png` を画像ビューワで開くと、3 本のバーが並んだチャートが
表示されます。これで CLI 動作確認は完了です。

JPEG 出力、ワイドキャンバス、透明背景などが欲しい場合は
`render` のフラグで対応できます。詳細は
[CLI レンダリング](./cli/) を参照してください。

## 次はどこへ

ユーザーガイドの続きは 2 系統に分かれます。

- **[CLI レンダリング](./cli/)** — メインのワークフロー。1 つの
  チャート入力に対して 1 枚の画像を返します。まずはこちらから。
- **[HTTP サーバー](./http/)** — 複数クライアントが同じ
  レンダラーを共有する長期稼働サービス向け。キャッシュ・認証・
  Docker も含みます。

あるいは、まず何が使えるのかを把握するには:

- **[同梱プラグイン](./plugins)** — Chart.js 本体に加え、12 の
  エコシステムプラグインが追加で使える `type` 値
  (treemap / sankey / wordcloud / choropleth …) を提供。追加
  セットアップ不要で、全レンダリングに同梱されます。
- **[インストール](./install)** — GitHub Releases、ソースビルド、
  その他のインストール方法。
