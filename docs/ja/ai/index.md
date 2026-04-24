---
title: AI ガイド
description: LLM エージェントから chartjs2img を使うチュートリアル - Claude Code プラグイン、GitHub gh skill、context7 MCP、llms.txt。
---

# AI ガイド

chartjs2img は **LLM エージェントから駆動される** ように設計されています。
自然言語で要件を伝え、エージェントが Chart.js 設定 JSON を生成し、
chartjs2img でレンダリングし、Chart.js エラーを読み戻して反復する —
リファレンスを手でコピペする必要はありません。

このガイドは **タスク志向**。下の 3 つの利用パスから 1 つ選び、
最初から最後までたどってください。各チュートリアルはクリーンな
マシンから始まり、PNG をレンダリングしたところで終わります
(更新コマンドも載せています)。

## エージェントから chartjs2img を使う 3 つの方法

| チュートリアル                            | 向いている場面                                                                    |
| ----------------------------------------- | --------------------------------------------------------------------------------- |
| [Claude Code プラグイン](./claude-plugin) | Claude Code を使っている。スラッシュコマンド (`/chartjs2img-install`, `/chartjs2img-author`, `/chartjs2img-render`) でワークフロー全体を駆動。 |
| [`gh skill`](./gh-skill)                  | 同じスキル一式を Copilot / Cursor / Gemini CLI / Codex にも (Claude Code と併用または代わりに) 入れたい。 |
| [context7 (MCP)](./context7)              | プラグイン側に何もインストールせず、MCP 経由でドキュメントを取得させたい。読み取り専用。 |

併用も可。Claude プラグインには CLI を取得する `/chartjs2img-install`
スキルが含まれます。`gh skill` で同じスキルを他ホストに入れられ、
context7 はプラグインなしでも動作する並列リトリーバルチャネルです。

## 必要なもの

chartjs2img 側では何もインストールしません。選んだチュートリアルが
要求するものを事前に入れてください。

| ソフトウェア                                                       | 対象チュートリアル                    | 理由                                    |
| ------------------------------------------------------------------ | ------------------------------------- | --------------------------------------- |
| [git](https://git-scm.com/)                                        | 全て                                  | プラグインマーケットプレースは git クローン。 |
| [Claude Code](https://code.claude.com/)                            | Claude プラグイン、context7           | スキル / MCP を実行するホスト。          |
| [GitHub CLI `gh`](https://cli.github.com/) (v2.90+)                | `gh skill`                            | `gh skill` サブコマンドを提供。          |
| [Cursor](https://cursor.com/) / [Gemini CLI](https://github.com/google-gemini/gemini-cli) / [Codex](https://openai.com/index/introducing-codex/) | `gh skill` (任意の対象)              | 代替スキルホスト。                      |
| `curl`, `tar`, `unzip` (Windows)                                   | `/chartjs2img-install` 実行時         | chartjs2img バイナリのダウンロード。    |
| `bun` ([インストール](https://bun.sh/))                            | chartjs2img をソースからビルドする場合のみ | リリースバイナリで代替可。           |

`chartjs2img` CLI は **手動インストール不要** — Claude プラグインに
`/chartjs2img-install` スキルが同梱、`gh skill` 利用者も同じスキルを
使えます。エージェント外で入れる場合は [クイックスタート](/ja/guide/)
または [インストール](/ja/guide/install) を参照。`chartjs2img` が `$PATH`
にあれば、スキルは自動的に拾います。

Chromium はレンダー時に chartjs2img 自身が扱います。linux-arm64 の
注意事項はメインのインストールガイドを参照。

## chartjs2img が公開する入口の全体像

チュートリアルを選ぶ前にフルツアーしたい場合:

- **[`chartjs2img llm`](./cli#chartjs2img-llm)** — Chart.js config JSON の形状、同梱プラグインの全オプション、標準例をワンショット Markdown で吐き出す。`/chartjs2img-author` スキルは JSON の形状とプラグインカタログを既に内包しているので、個別プラグインの詳細オプション表がほしいときだけエージェントがここに落ちてくる設計。
- **[`/llms.txt`](https://chartjs2img.ideamans.com/llms.txt) + [`/llms-full.txt`](https://chartjs2img.ideamans.com/llms-full.txt)** — ドキュメントサイト直下のパブリック発見ファイル。
- **[`context7.json`](https://github.com/ideamans/chartjs2img/blob/main/context7.json)** — [context7](./context7) MCP リトリーバルに登録。
- **[`plugins/chartjs2img`](https://github.com/ideamans/chartjs2img/tree/main/plugins/chartjs2img)** — Claude Code と `gh skill` で配布される 3 スキル (`chartjs2img-install`, `chartjs2img-render`, `chartjs2img-author`)。

[CLI リファレンス](./cli) は `chartjs2img llm` を完全に文書化 — エージェント
がスキル経由で駆動する場合も、ターミナルで手動実行する場合も参照できます。

## チュートリアル

ここから:

- **[Claude Code プラグイン](./claude-plugin)** — 既に Claude Code を使っていれば 10 分。
- **[`gh skill`](./gh-skill)** — Copilot / Cursor / Gemini / Codex にスキルを入れたい場合。
- **[context7](./context7)** — chartjs2img 固有物を何も入れずに、MCP 経由でドキュメントを *取得* させたい場合。
