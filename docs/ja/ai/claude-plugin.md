---
title: Claude Code プラグイン
description: Claude Code にプラグインマーケットプレース経由で chartjs2img スキルを導入 - クリーンなマシンから Chart.js PNG まで 10 分。
---

# Claude Code プラグイン

`chartjs2img` プラグインは 3 つのスキルを同梱しており、Claude Code が
CLI のインストール、説明からの config 作成、PNG / JPEG / WebP
レンダリングを行えます。Chart.js の JSON 形状とプラグインカタログは
`/chartjs2img-author` スキル本体に内包されているため、「リファレンスを
先に読み込む」という別手順は不要です。

## 前提条件

- [Claude Code](https://code.claude.com/) が動作する環境。
- `git` が PATH にある (マーケットプレースは git クローン)。

これだけ。プラグインの `/chartjs2img-install` スキルが CLI バイナリと
Chromium の自動ダウンロードまで面倒を見ます。

## 1. マーケットプレースの追加

chartjs2img プラグインは **ideamans/claude-public-plugins**
(Ideamans のオープンソースプラグインをまとめたマーケットプレース)
経由で配布されます。

Claude Code で:

```
/plugin marketplace add ideamans/claude-public-plugins
```

初回追加時にマーケットプレースをクローン、以降のセッションはキャッシュを
再利用します。Claude Code は次のような確認を返します:

```
Added marketplace ideamans-plugins from github.com/ideamans/claude-public-plugins
```

## 2. プラグインのインストール

```
/plugin install chartjs2img@ideamans-plugins
```

3 つのスラッシュコマンドが登録されます:

- `/chartjs2img-install` — CLI をインストール / 更新
- `/chartjs2img-author` — 説明から config を作成 (JSON 制約とプラグイン
  カタログをスキル本体に内包)
- `/chartjs2img-render` — config を PNG / JPEG / WebP にレンダリング

## 3. CLI バイナリのインストール

```
/chartjs2img-install
```

このスキルは:

1. OS + arch (linux / darwin / windows × amd64 / arm64) を検出。
2. 対応するリリースアーカイブを github.com/ideamans/chartjs2img/releases から取得。
3. SHA-256 チェックサムを検証。
4. バイナリを `~/.local/bin` (または書き込み可能な PATH ディレクトリ) に配置。
5. `chartjs2img --version` で確認。

書き込み可能な PATH ディレクトリが無い場合、バイナリを `/tmp` に
ステージして、インストールを完了するための `sudo mv` コマンドを出力。

確認:

```
chartjs2img --version
```

`chartjs2img v0.2.2` (または最新タグ) が出ればOK。

## 4. チャートの作成

```
/chartjs2img-author 1〜6 月の売上棒グラフ、データは 12 19 3 5 2 15
```

スキルがチャートタイプ (`bar`) を選び、現実的な骨組みを埋め、
`chartjs2img render` で検証し、Chart.js エラーメッセージがクリーンに
なるまで反復します。

最後に PNG パスと JSON config を返すので、保存・編集・自分のパイプラインへの
投入などに使えます。

特定プラグインの詳細オプション表が必要になった場合は、エージェントが
`chartjs2img llm` (CLI サブコマンド) を会話にパイプします。詳細は
[CLI リファレンス](./cli#chartjs2img-llm)。

## 5. 既存 config のレンダリング

`.json` ファイルがすでに手元にある場合:

```
/chartjs2img-render sales.json
```

スキルは `chartjs2img render` の stderr をリダイレクトし、
`[chart ERROR]` / `[chart WARN]` メッセージを検査。クリーンレンダーは
1 行サマリ (パス + サイズ) で終了、メッセージが出たケースは具体的な
修正提案 (chart type のタイポ、データセット形状ミスなど) で終了します。

## 更新

新しい chartjs2img バージョンがリリースされたら:

```
/plugin marketplace update
/plugin update chartjs2img@ideamans-plugins
/chartjs2img-install      # CLI バイナリを in-place 更新
```

プラグインマニフェストの `version` は chartjs2img 自身のバージョンに
ピン止めされているので、CLI の bump = プラグインの bump。

## トラブルシューティング

**`/chartjs2img-* : unknown command`** — プラグイン未インストール。
`/plugin list` で確認。なければステップ 2 を再実行。

**`chartjs2img: command not found`** — バイナリが PATH にない。
`/chartjs2img-install` を再実行するか、シェルが `~/.local/bin` を
拾ったか確認 (新しいシェルを起動 or `exec $SHELL`)。

**レンダリングが Chromium エラーで失敗** — 初回レンダー時、
chartjs2img は Chrome for Testing を自動 DL。失敗するケース
(ファイアウォール、企業プロキシ、linux-arm64) では手動インストール +
`CHROMIUM_PATH` 設定にフォールバック。[インストール](/ja/guide/install) を参照。

**レンダリングされた画像が空白** — スキルの出力で `X-Chart-Messages` を
確認。`chart.type` のタイポか `datasets` 欠落が典型。技術的には
レンダリング成功 (exit 0) ですが、Chart.js が描画を諦めた状態です。

## 関連項目

- [CLI リファレンス](./cli) — `chartjs2img llm` の出力形式。
- [`gh skill` チュートリアル](./gh-skill) — 同じスキルを Copilot / Cursor / Gemini / Codex で。
- [プラグイン公開チェックリスト](https://github.com/ideamans/chartjs2img/blob/main/plugins/chartjs2img/PUBLISH.md) — プラグインとリリースを同期する方法。
