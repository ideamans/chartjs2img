---
title: gh skill (Copilot / Cursor / Gemini CLI / Codex)
description: gh skill install で Agent Skills 対応ホストに chartjs2img スキルをインストール - GitHub Copilot、Cursor、Gemini CLI、OpenAI Codex。
---

# `gh skill` (マルチホスト)

Claude Code プラグインが同梱するのと同じ `SKILL.md` ファイルは
Agent Skills 標準仕様そのもの。`gh skill` (GitHub CLI v2.90+) は、
その仕様を守るあらゆるホストへインストールできます。

## このチュートリアルは誰向けか

Claude プラグインチュートリアルではなく `gh skill` を選ぶ場面:

- **GitHub Copilot**、**Cursor**、**Gemini CLI**、または **OpenAI Codex** を (Claude Code と併用または単独で) 使っている。
- 特定の git tree SHA にピン止めして、更新を明示的に管理したい。
- Claude マーケットプレースより `gh` ワークフローに慣れている。

## 前提条件

- GitHub CLI **v2.90.0 以降** (`gh --version`)。
- ターゲットホスト (Copilot / Cursor / Gemini / Codex / Claude Code) がインストール済みで動作すること。

確認:

```bash
gh --version         # ≥ 2.90.0 が必要
gh skill --help      # skill サブコマンドが install / update / preview / search / publish を出す
```

## 3 つのスキルを個別にインストール

各スキルは独立してインストール可能。欲しいものだけ選べます。
典型的なフルセット:

```bash
gh skill install ideamans/chartjs2img plugins/chartjs2img/skills/chartjs2img-render   --agent claude-code
gh skill install ideamans/chartjs2img plugins/chartjs2img/skills/chartjs2img-author   --agent claude-code
gh skill install ideamans/chartjs2img plugins/chartjs2img/skills/chartjs2img-install  --agent claude-code
```

`--agent` には `claude-code`, `copilot`, `cursor`, `gemini`, `codex`
のいずれか。同じコマンドを異なる `--agent` 値で繰り返すと、複数の
ホストにインストールできます。

インストール済み一覧:

```bash
gh skill list
```

## スキルバンドル概要

Claude Code プラグインと同じ 3 スキル (内容が drift しないように):

| スキル                      | 使い所                                                             |
| --------------------------- | ------------------------------------------------------------------ |
| `chartjs2img-install`       | `chartjs2img` CLI バイナリをインストール / 更新する               |
| `chartjs2img-author`        | 説明があって JSON config が無い。Chart.js の JSON 形状と 14 プラグインカタログを内包 |
| `chartjs2img-render`        | JSON config があって PNG / JPEG / WebP が欲しい                    |

特定プラグインのオプション詳細が必要なときは `chartjs2img llm`
(CLI サブコマンド) を利用します。全文 (~1400 行) または `## <プラグイン名>`
の節だけをエージェントに流し込めます。

いずれも標準仕様準拠の frontmatter (`name`, `description`,
`license`, `compatibility`, `allowed-tools`) のみ使用 —
[Agent Skills 仕様](https://agentskills.io/specification) を参照。
Claude 専用フィールドは使っていないので、Copilot にインストールした
スキルも Claude Code にインストールしたスキルと同じように動作します。

## frontmatter による provenance

`gh skill install` は、ホストのスキルディレクトリに配置する SKILL.md
コピーに 3 フィールドを書き込みます:

- `repository: ideamans/chartjs2img`
- `ref: main` (または指定したリファレンス)
- インストール時の `plugins/chartjs2img/skills/<name>` の tree SHA

この tree SHA を使って `gh skill update` が変更を検出 — こちら側で
バージョン bump は不要。スキル本体の変更が自動で `gh skill update` で
反映されます。

## 更新

```bash
gh skill update            # インストール済みスキル全てを更新
gh skill update chartjs2img-render    # 名前で 1 つだけ
```

## 特定バージョンへのピン止め

既定で `gh skill install` は現在の `main` tree SHA にピン止めします。
特定リリースに固定する場合:

```bash
gh skill install ideamans/chartjs2img plugins/chartjs2img/skills/chartjs2img-render \
  --ref v0.2.2 \
  --agent claude-code
```

`v0.2.2` を欲しい chartjs2img タグに置き換え。ピン止め解除を明示しない限り
`gh skill update` はピンを離しません。

## `gh skill` でできないこと

- `gh skill` は `chartjs2img` CLI バイナリ自体はインストールしません。インストール後はホストから `/chartjs2img-install` を実行、またはメインの [インストールガイド](/ja/guide/install) を参照。
- `gh skill` はホスト間のスキルをオーケストレートしません。複数のエージェントに同じスキルを入れるには、`gh skill install` を `--agent` ごとに実行してください。

## インストールの確認

エージェントホストで 3 スキルのいずれかを呼び出す — 例えば
`/chartjs2img-render`。「skill not found」エラーなくスキル本体が返るべき。

スキルが見つからない場合、`gh skill list` を確認し、ホスト固有のスキル
ディレクトリ (Claude Code: `~/.claude/skills/`、他はホストのドキュメント参照)
を見てください。

## 関連項目

- [Claude Code プラグイン](./claude-plugin) — 別のインストール経路。
- [CLI リファレンス](./cli) — `chartjs2img llm` が返す内容。
- [Agent Skills 仕様](https://agentskills.io/specification) — スキルが実装するオープン標準。
