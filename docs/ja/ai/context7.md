---
title: context7 (MCP 取得)
description: chartjs2img を context7 に登録して、MCP 対応エージェントが chartjs2img 固有物をインストールせずに Chart.js + プラグインリファレンスを取得できるようにする。
---

# context7 (MCP 取得)

[context7](https://context7.com/) は Upstash の MCP サービスで、
リポジトリのドキュメントをクロールし、[MCP](https://modelcontextprotocol.io/)
を話すあらゆるエージェントに配信します。chartjs2img を 1 度登録すれば、
MCP 対応エージェント (Claude Code、Cursor、Gemini CLI、Codex、その他
仕様を使うもの全て) が他に何もインストールせずに docs を resolve / query
できます。

これは **読み取り専用** の経路 — context7 はエージェントにチャートを
レンダリングさせる機能は与えません。それには [Claude プラグイン](./claude-plugin)
または [`gh skill`](./gh-skill) チュートリアルと組み合わせてください。

## context7 が chartjs2img に対して行うこと

エージェントが「chartjs2img で棒グラフにデータラベルを表示するには?」
と問い合わせると、context7 は:

1. `chartjs2img` を登録済みのライブラリ ID にリゾルブ。
2. docs から該当箇所を検索 (datalabels セクション + bar の例 + `plugins/datalabels.display: true` の要件)。
3. MCP ツール出力としてエージェントに返す。

CLI インストールなし、スキルインストールなし、バイナリダウンロードなし。
純粋なドキュメント取得。

## セットアップ内容

リポジトリ直下の `context7.json` が、context7 に索引対象を伝えます:

```json
{
  "$schema": "https://context7.com/schema/context7.json",
  "projectTitle": "chartjs2img",
  "description": "Server-side Chart.js rendering service...",
  "folders": ["docs/en", "examples", "src/llm-docs"],
  "excludeFolders": ["docs/.vitepress", "docs/public", "docs/ja", "node_modules", "dist", "tests"],
  "rules": ["Input is always Chart.js configuration JSON. ...", "..."]
}
```

`rules` 配列には chartjs2img 固有の落とし穴 9 件 — JSON 入力形状、
関数不可、animation 強制 OFF、datalabels 既定 OFF、X-Chart-Messages
フィードバック、終了コード、Chromium 利用可否。エージェントはどの
特定ドキュメントパッセージを取得しても、常にこれらを一緒に見ます。

実ファイル: [github.com/ideamans/chartjs2img/blob/main/context7.json](https://github.com/ideamans/chartjs2img/blob/main/context7.json)

## MCP 対応エージェントからの使い方

### Claude Code

セッションで 2 つの MCP ツールが関係します:

- `mcp__context7__resolve-library-id` — 入力: `"chartjs2img"` または曖昧なフレーズ。出力: 正規のライブラリ ID。
- `mcp__context7__query-docs` — 入力: ライブラリ ID + 自然言語の質問。出力: 取得されたパッセージ。

エージェントが自動で走らせるフロー例:

```
user: 「データラベル付きの円グラフを描いて」
assistant calls mcp__context7__resolve-library-id("chartjs2img")
      → returns "/ideamans/chartjs2img"
assistant calls mcp__context7__query-docs(
      libraryId="/ideamans/chartjs2img",
      query="pie chart with data labels")
      → returns the pie example + the datalabels section
assistant drafts a JSON config and (プラグインが入っていれば)
          calls /chartjs2img-render to produce the PNG.
```

### 他の MCP ホスト

MCP を話すエージェントホストは、context7 をサーバーとして追加できます:

```bash
# MCP ホストの設定内
servers:
  context7:
    url: https://mcp.context7.com/
```

正確な設定パスはホストのドキュメントを確認してください (MCP サーバー
設定の保存場所はホストごとに異なります)。

## context7 が役立つ場面と不向きな場面

- **役立つ場面** — 「オプション X は何をする」「機能 Y はどのプラグインが扱う」「チャートタイプ Z のデータ形状は」といった質問への回答。ワンショット取得、インストール不要。
- **不向きな場面** — 実際のレンダリング。それには CLI バイナリが必要。[Claude プラグイン](./claude-plugin) または [`gh skill`](./gh-skill) を使ってレンダリングループを組む。
- **相補的** — context7 + author/render スキルがベストな組み合わせ。context7 が正しいオプション形状を浮かび上がらせ、render スキルがクリーンな PNG を生成することを検証。

## 登録の成功確認

`context7.json` を push した後、context7 は独自のスケジュールでクロール
(通常数時間)。context7 Web UI ([context7.com/add-package](https://context7.com/add-package))
から優先クロールを要求できます。

索引化後、Claude Code からテスト:

```
mcp__context7__resolve-library-id  → 「chartjs2img」を問い合わせ
```

`/ideamans/chartjs2img` のような結果が返るはず。空が返ったらクロール
未完了、1〜2 時間後に再確認。

## 索引から除外しているもの

- `docs/ja/**` — 日本語は英語のミラーで、重複コンテンツは取得品質を下げる。英語を正規として扱う。
- `docs/.vitepress/**` — ビルド設定、コンテンツではない。
- `docs/public/**` — 生成成果物 (llms.txt、サンプル PNG)。
- `node_modules/`, `dist/`, `tests/` — docs ではない。

日本語取得が必要な場合は Issue を起こしてください — JA docs 用に
context7 エントリを別途追加できます。

## 関連項目

- [llms.txt](./llms-txt) — サイトルートに置かれた並列・シンプルな発見ファイル。
- [CLI リファレンス](./cli) — `chartjs2img llm` が同じリファレンスをオフラインで生成。
- [context7 ドキュメント](https://context7.com/docs/adding-libraries) — 自分のプロジェクトを登録する方法。
