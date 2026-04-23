---
title: llms.txt
description: chartjs2img docs ルートの 2 つのパブリック発見ファイル - llms.txt (インデックス) と llms-full.txt (全文バンドル) - とエージェントの使い方。
---

# llms.txt

chartjs2img は docs サイト直下に 2 つのパブリック発見ファイルを
公開しています。[llmstxt.org](https://llmstxt.org/) の規約に従います。
chartjs2img の知識が無いまま着地した LLM エージェントのために設計されています。

| URL                                                                             | サイズ     | 内容                                                            |
| ------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------- |
| [`/llms.txt`](https://chartjs2img.ideamans.com/llms.txt)                        | 約 3 KB    | インデックス: 英語 docs の全ページへのグルーピングされたリンク集 |
| [`/llms-full.txt`](https://chartjs2img.ideamans.com/llms-full.txt)              | 約 135 KB  | 全文バンドル: 全ページの Markdown 連結 + `chartjs2img llm` リファレンス |

## どちらをいつ使うか

### `llms.txt` — インデックス

エージェントが **ブラウズ** したいときに使用。次を含む短い Markdown 文書:

- H1 プロジェクトタイトル
- ブロッククォート形式のサマリ
- `## User Guide`, `## Developer Guide`, `## AI Guide`, `## Gallery` セクション、各々にページへの bullet リンク
- 最後に `## LLM reference (single bundle)` で `llms-full.txt` へのポインタ

シェルから使用する例:

```bash
curl -s https://chartjs2img.ideamans.com/llms.txt | head -20
```

### `llms-full.txt` — 全文バンドル

エージェントが **全てを 1 つのペイロードで** 欲しいときに使用。
全英語ページの Markdown 本体を `<!-- source: ... -->` コメント付きで
連結し、`---` 水平線で区切り、最後に `chartjs2img llm` の約 1400 行の
Chart.js + プラグインリファレンスを追加しています。

これは「マニュアル全部をエージェントに渡してコンテキスト内で検索させる」
という使い方。以下の場面で適切:

- リトリーバルツールを持たないワンショットエージェント (全部をシステムプロンプトにコピー)
- 拡張コンテキストウィンドウ (Claude、Gemini、GPT-4o の長文モード)
- オフライン検査 / 監査

```bash
curl -s https://chartjs2img.ideamans.com/llms-full.txt | wc -l
```

## ファイルの生成方法

`docs/public/llms.txt` と `docs/public/llms-full.txt` は **コミットされません**。
`scripts/build-llms-txt.ts` がサイトビルド時に再生成します:

1. `docs/en/**/*.md` を走査し、タイトル + ボディを抽出。
2. ルートでページを並べ替え。
3. `llms.txt` → トップレベルセクション毎にグループ化、リンクリストを出力。
4. `llms-full.txt` → 全ボディを連結、`getLlmDocs()` (Chart.js + プラグインリファレンスの集約) を追加。
5. `docs/public/` に書き出し — VitePress がサイトルートから配信。

手動トリガー:

```bash
bun run build-llms-txt
# 出力:
#   wrote <N> chars → docs/public/llms.txt
#   wrote <N> chars → docs/public/llms-full.txt (<N> docs concatenated)
```

同じスクリプトが `docs:dev` / `docs:build` / `ai:regen` 内でも実行されます。

## 他の AI チャネルとの関係

| チャネル                | 利用者                                      | 配布経路                                |
| ----------------------- | ------------------------------------------- | --------------------------------------- |
| **llms.txt**            | `curl` できる任意のエージェント              | docs サイトの静的ファイル                |
| **llms-full.txt**       | 同上、検索より全文の方が安いとき              | docs サイトの静的ファイル                |
| [**context7**](./context7)    | MCP 対応ホスト                              | MCP サーバー                             |
| [**Claude プラグイン**](./claude-plugin) | Claude Code                        | マーケットプレース                      |
| [**gh skill**](./gh-skill)   | Copilot / Cursor / Gemini / Codex          | GitHub CLI                              |
| [**`chartjs2img llm`**](./cli)| chartjs2img 自体を走らせるエージェント      | CLI 出力 (`chartjs2img llm`)            |

llms.txt は最もシンプルで、インストール不要のチャネル。ゼロ設定のシェル
スクリプトでもフェッチして使えます。

## エージェントが `llms-full.txt` でやるべきこと

エージェントセッションの有用なオープニングターン:

```
SYSTEM: あなたはこれから chartjs2img がレンダリングする Chart.js 設定 JSON を
        作成します。完全なリファレンスが以下です。入力形式、全サポート
        チャートタイプ、全同梱プラグインのオプション、エラーフィードバック、
        標準例を含みます。

        ---
        <https://chartjs2img.ideamans.com/llms-full.txt の全文をここに貼る>
        ---

        Chart.js 設定を作成する際:
        1. 次の `chartjs2img render` 呼び出しで検証する。
        2. X-Chart-Messages (HTTP) または stderr (CLI) が非空なら、
           設定を修正して再試行する。
        3. 最終 JSON とレンダリングされた画像パスを報告する。
```

## URL 規約

両ファイルは固定パスで配信され、安定性が保証されます:

- `https://chartjs2img.ideamans.com/llms.txt`
- `https://chartjs2img.ideamans.com/llms-full.txt`

リダイレクトなし、認証なし、User-Agent スニッフィングなし。どんな
環境からでも `curl` できるように意図されています。

## 関連項目

- [llmstxt.org](https://llmstxt.org/) — パブリック標準。
- [Anthropic の llms.txt](https://code.claude.com/docs/llms.txt)、[Vercel の](https://vercel.com/llms.txt)、[Next.js の](https://nextjs.org/docs/llms-full.txt) — 実装例。
- [context7](./context7) — 全文バンドルよりも検索を好むエージェント向けの並列 MCP リトリーバル。
- [CLI リファレンス](./cli) — `llms-full.txt` が追加するリファレンスを `chartjs2img llm` がどう生成するか。
