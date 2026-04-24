---
title: chartjs2img llm
description: chartjs2img llm CLI サブコマンドのリファレンス - 有効な config を初手で書くためにエージェントが必要とする全てをワンショットで教える Chart.js + プラグインリファレンス。
---

# CLI リファレンス — `chartjs2img llm`

このページは **リファレンス** であってチュートリアルではありません。
何もインストールしていない場合は、いずれかのチュートリアル
([Claude プラグイン](./claude-plugin) / [`gh skill`](./gh-skill)
/ [context7](./context7)) から始めてください。

LLM 向けに特化した `chartjs2img` サブコマンドが 1 つあります:
`chartjs2img llm`。Chart.js コア + 同梱プラグインの自己完結な Markdown
リファレンスを出力します。セッション開始時にエージェントのコンテキストに
パイプしておくと、初手で正しい config が出ます。

## 使い方

```sh
chartjs2img llm
```

- ネットワークアクセスなし。
- 引数なし。
- stdout のみ。

出力が扱う範囲:

- **使用ガイド** — chartjs2img の呼び出し方 (CLI vs HTTP)、入力 JSON の形状、制約 (JSON のみ、関数不可)、注意事項。
- **Chart.js コア** — 組み込み 8 チャートタイプ全て (`bar`, `line`, `pie`, `doughnut`, `radar`, `polarArea`, `scatter`, `bubble`)、データセットプロパティ、スケール、`title` / `legend` / `tooltip` のオプションツリー。
- **同梱プラグインのオプション** — 12 セクション:
  - `chartjs-plugin-datalabels`
  - `chartjs-plugin-annotation`
  - `chartjs-plugin-zoom`
  - `chartjs-plugin-gradient`
  - `chartjs-chart-treemap`
  - `chartjs-chart-matrix`
  - `chartjs-chart-sankey`
  - `chartjs-chart-wordcloud`
  - `chartjs-chart-geo`
  - `chartjs-chart-graph`
  - `chartjs-chart-venn`
  - `chartjs-adapter-dayjs-4`

各セクションにはオプション表 (プロパティパス、型、既定値、説明) と
JSON 例が含まれます。

Markdown はソース (`src/llm-docs/*.ts`) からビルド毎に再生成されるので、
実装と drift することはありません。

## 出力構造

おおよその構造:

```
# Usage

<入力 JSON 形状、HTTP vs CLI、JSON 制約、エラーフィードバック、終了コード>

## Chart.js core (chart.js@4.4.9)

<type、data、datasets、options、scales、title、legend、tooltip>

## Datalabels (chartjs-plugin-datalabels)

<display、anchor、align、color、font — chartjs2img 固有の
 「既定で OFF」ポリシー含む>

## Annotation (chartjs-plugin-annotation)

<line、box、label、point、polygon、ellipse>

## Zoom (chartjs-plugin-zoom)

...

## Gradient (chartjs-plugin-gradient)

...

<加えて 7 つの追加チャートタイププラグインと日付アダプタ>
```

合計出力: 約 1400 行、約 135 KB。現代のコンテキストウィンドウに快適に収まります。

## エージェントプロンプトテンプレート

### 最小 — オープニングターン

```text
これから chartjs2img がレンダリングする Chart.js 設定を作成します。
完全なリファレンスが以下です。JSON config を作成したら:
1. `chartjs2img render -i <file> -o /tmp/check.png 2> /tmp/check.err` で検証。
2. /tmp/check.err が非空なら修正して再試行。
3. 最終 JSON とレンダリングされた画像パスを報告。

---
<`chartjs2img llm` の出力をここに貼る>
---
```

### 詳細版 — 明示的な落とし穴付き

```text
<上記>

覚えておくべき落とし穴:
- JSON には関数がない — `options.scales.y.ticks.callback` や `datalabels.formatter` を使わない。
- animation は強制 OFF — 動きのある config を提案しない。
- datalabels は既定で無効 — ラベルを表示するには `options.plugins.datalabels.display: true` を設定。
- 時間軸には `"type": "time"` が必要 — dayjs アダプタは同梱されている。
```

## 標準 LLM CLI へのパイプ

### OpenAI / 汎用 `llm` CLI

```sh
chartjs2img llm \
  | llm -s "1〜6 月の売上棒グラフを作成。値は 12 19 3 5 2 15"
```

### クリップボード (macOS)

```sh
chartjs2img llm | pbcopy
```

そしてエージェントのシステムプロンプト欄に貼り付け。

### ファイル

```sh
chartjs2img llm > /tmp/chartjs2img-reference.md
```

セッション間で再利用。

## 他の AI チャネルとの関係

- docs サイト上の **`llms-full.txt`** はこのリファレンスのスーパーセット — 全 `docs/en/` Markdown ページを同じリファレンスに追加したもの。リファレンスとガイドを 1 つのペイロードで欲しいときに使用。
- **context7** は同じコンテンツを MCP 経由で取得 — 全文バンドルがコンテキストウィンドウに入らないとき。
- **`chartjs2img-author` の SKILL.md** は JSON 形状、エラーフィードバック契約、プラグインカタログを内包しており、スキル単体で自己完結します。個別プラグインの詳細オプション表が必要なときのみ `chartjs2img llm` にフォールバックします。

どのチャネルをエージェントが使っても、実コンテンツは同じ
`src/llm-docs/*.ts` ファイル群から派生するので一貫性が保証されます。

## 拡張

`chartjs2img llm` の出力を追加 / 変更するには、`src/llm-docs/` 下の該当
ファイルを編集。完全なフォーマットは [開発者ガイド → LLM ドキュメントの追加](/ja/developer/adding-llm-doc)
を参照。

## トラブルシューティング

**`chartjs2img: command not found`** — まずバイナリをインストール。
[インストール](/ja/guide/install) を参照するか、Claude プラグインを
持っていれば `/chartjs2img-install` を実行。

**出力が空** — バグです。Issue を起こしてください。アグリゲーターは
常に最低でも `usage` セクションを持ちます。

**出力が古そう** — `chartjs2img --version` を確認。各リリースは
`src/template.ts` にピン止めされたプラグインバージョンから `src/llm-docs/`
を再ビルドします。古いバイナリは古いプラグインバージョンを反映します。

## 関連項目

- [AI ガイド 概要](./) — チュートリアルを選ぶ。
- [llms.txt](./llms-txt) — 同じリファレンスを静的ファイルで配信。
- [開発者ガイド → LLM ドキュメントの追加](/ja/developer/adding-llm-doc) — 出力を拡張する方法。
