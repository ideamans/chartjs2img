---
title: LLM ドキュメントの追加
description: chartjs2img llm リファレンス出力の拡張方法 - ファイル形式、登録、慣習。
---

# LLM ドキュメントの追加

`chartjs2img llm` は約 1400 行の Markdown リファレンスを出力し、
LLM に「chartjs2img 向けの Chart.js 設定を書く方法」を教えます。各セクションは
`src/llm-docs/*.ts` の個別ファイルに格納されています。

## 追加タイミング

- [Chart.js プラグインの追加](./adding-plugin) でプラグインを追加した。各プラグインに 1 ファイル。
- 既存リファレンスが、エージェントが頻繁に引っかかる罠を見落としている。
- プラグインバージョンアップでオプション形状が変わった。

## ファイル形状

`llm-docs/*.ts` は単一目的の ESM モジュールで、`doc` という名前の
文字列を export します:

```ts
// src/llm-docs/plugin-example.ts
export const doc = `
## Example plugin (chartjs-plugin-example)

<プラグインが何をするかの 1 段落要約>

### オプション

| オプション                              | 型       | 既定値   | 説明                     |
| --------------------------------------- | -------- | -------- | ------------------------ |
| \`options.plugins.example.enabled\`     | boolean  | \`false\` | マスタートグル        |
| \`options.plugins.example.color\`       | string   | -        | CSS カラー               |

### JSON 例

\`\`\`json
{
  "type": "bar",
  "data": { "labels": ["A"], "datasets": [{ "data": [1] }] },
  "options": {
    "plugins": {
      "example": { "enabled": true, "color": "#f39c55" }
    }
  }
}
\`\`\`

### 注意

- \`enabled: true\` が必要; 既定で無効。
- \`type: "treemap"\` には対応していない。
`
```

エスケープルール:

- このファイルはテンプレートリテラルなので、バッククォートはエスケープします (`` \` ``)。
- コードフェンス内 JSON の `\n` は実改行になる — Markdown を JS 文字列内に書く感覚。
- TypeScript は Markdown を型チェックしない。手作業で一貫性を保つこと。

## 登録

`src/llm-docs/index.ts` が集約器:

```ts
import { doc as pluginExample } from './plugin-example'

const docs = [
  // ...既存エントリ...
  pluginExample,
]
```

順序が重要 — `getLlmDocs()` はエントリを配列順で `\n\n` で結合。現在の慣習:

1. `usage` (必ず最初 — コンテキストを設定)
2. `chartjsCore`
3. 装飾プラグイン (datalabels、annotation、zoom、gradient)
4. チャートタイププラグイン (treemap、matrix、sankey、wordcloud、geo、graph、venn)
5. 日付アダプタ (`adapterDayjs`) は最後

新エントリは該当するグループに挿入。

## 慣習

**見出し。** 各ファイルを `## <プラグイン表示名>` (H2、H1 ではない — バンドル内に
トップレベル H1 は無い) で始める。サブセクションは H3。

**オプション表。** プラグイン毎に 1 つの大きな表。フルパスをバッククォートで
(`options.plugins.foo.bar`)。型列は自由記述 (「関数または文字列」のような文でも OK)。
必須フィールドは既定値列に `*required*` と書く。

**例。** 少なくとも 1 つの動作する JSON 例を必ず含める。データは小さく
(2〜3 ポイントで形状が示せる)。`chartjs2img render` にコピペで動くこと。

**注意。** LLM が間違えがちなことを箇条書き。最も頻出を先頭に。
「このプラグインは明示的に有効化が必要」は最初の bullet によくある項目。

**コールバック / 関数は不可。** Chart.js オプションは関数 (`ticks.callback` 等)
を runtime API では受け付けるが、HTTP/CLI 入力は JSON。JSON で完全に表現
できないプラグインがあれば明記する。

**chartjs2img 自体の言及は抑制。** このドキュメントは Chart.js 設定を教える
ためのもので、chartjs2img 内部を教えるものではない。プラグインドキュメントは
ポータブルに保つ。

## 検証

```bash
# 1. 型チェック
bun run typecheck

# 2. 出力を目視
bun run cli -- llm | less

# 3. 新セクションが grep でヒットするか
bun run cli -- llm | grep -A 20 "Example plugin"

# 4. 全体行数 (プラグイン毎 30〜200 行が妥当)
bun run cli -- llm | wc -l
```

## ここに書かないもの

- **リリースノート / changelog。** ここは常緑のリファレンスであり履歴ではない。
- **サーバー運用。** 環境変数、Docker 設定等は [ユーザーガイド](../guide/) に。
- **Claude 専用指示。** Agent Skills ファイル (`plugins/chartjs2img/skills/*` の SKILL.md)
  が適切な置き場所 — context7 / Claude 専用の読者。`chartjs2img llm` はホスト中立。

`docs/public/llms-full.txt` を LLM docs と guide ページから自動生成する
計画は PLAN.md の **Phase 2-B** を参照。
