---
title: モジュール
description: chartjs2img の全 src/*.ts の 1 行サマリ - 何を export し、誰が import しているか。
---

# モジュール

各ソースモジュールが何を export し、誰が import するかを表にまとめました。
どのファイルを開くかを決める際のガイドに使ってください。

## `src/index.ts` — CLI エントリポイント

バイナリの `main()`。`argv` を解析し、使用法バナーを出力し、
`serve` / `render` / `examples` / `llm` / `help` / `version` のいずれかに
振り分けます。ビジネスロジックはなく、argv → 関数呼び出しに徹しています。

**Exports**: なし (スクリプトエントリ)。
**Imports**: `server.ts`, `cli.ts`, `version.ts`, `llm-docs/index.ts`。

## `src/server.ts` — HTTP サーバー

`startServer()` が `Bun.serve()` を起動、`/render`、`/cache/:hash`、`/health`、
`/examples` にリクエストをルーティング (未知のパスは 404)。認証は
`checkAuth()` で処理。

**Exports**: `startServer(config)`、`ServerConfig` インターフェース。
**Imports**: `renderer.ts`, `cache.ts`, `examples.ts`, `version.ts`, `template.ts` (型のみ)。

## `src/cli.ts` — CLI の `render` と `examples`

- `cliRender()` が stdin またはファイルから JSON を読み、`renderChart()` を
  呼び、stdout またはファイルに画像を書き、Chart.js メッセージを stderr に出力。
- `cliExamples()` が `EXAMPLES` を走査し、各々に `renderChart()` を呼び、
  `NN-<slug>.{png,jpg}` + `NN-<slug>.json` を `--outdir` に書き出す。

**Exports**: `cliRender`、`cliExamples`、それぞれの引数インターフェース。
**Imports**: `renderer.ts`, `examples.ts`, `template.ts` (型のみ)。

## `src/renderer.ts` — Chromium パイプライン

レンダリングの中枢。担当する処理:

- **Chromium 検出 & 自動インストール** — `findChromiumExecutable()`、
  `downloadChromeForTesting()`、`ensureChromiumInstalled()`。
- **ブラウザライフサイクル** — `ensureBrowser()`、`launchBrowser()`、
  `closeBrowser()`。モジュールレベルの単一 `browser` 参照、遅延起動、
  `disconnected` で自動クリア。
- **ページライフサイクル** — `schedulePageCleanup()` が
  `PAGE_TIMEOUT_SECONDS` 後にタブを強制クローズする `setTimeout` を仕込む。
- **レンダリングエントリ** — `renderChart()` がこのモジュールから
  露出する唯一の関数。ハッシュ算出、キャッシュ get/set、セマフォ取得/解放、
  HTML 構築、`page.goto(data:…)`、コンソール捕捉、スクショを全て行う。
- **ステータス** — `/health` 向けに `rendererStats()`。

**Exports**: `renderChart`, `closeBrowser`, `rendererStats`,
`ConsoleMessage`, `RenderResult`。
**Imports**: `puppeteer-core`, `template.ts`, `semaphore.ts`, `cache.ts`。

## `src/template.ts` — ブラウザ側 HTML

Chart.js + 12 プラグインの全 CDN `<script>` と、以下を行う IIFE を含む静的 HTML 文字列:

- 自動登録しないプラグインを登録 (datalabels、chartjs-chart-geo);
- アニメーションを強制 OFF;
- `console.warn` / `console.error` をラップして `window.__chartMessages` に;
- try/catch で `Chart` をインスタンス化;
- 完了時に `window.__chartRendered = true`。

プラグイン追加/削除/バージョンアップ時はこのファイルを編集。
[Chart.js プラグインの追加](./adding-plugin) を参照。

**Exports**: `buildHtml(options)`、`RenderOptions` インターフェース、`LIBS` 定数。
**Imports**: なし。

## `src/cache.ts` — メモリ内キャッシュ

LRU 風の追い出し (`size >= MAX_ENTRIES` で最古キーを追い出し) と TTL
(`getCache` で遅延失効) を持つ `Map<string, CacheEntry>`。
`computeHash()` は `{chart, width, height, devicePixelRatio,
backgroundColor, format, quality}` を SHA-256 でハッシュし、先頭 16 桁 (hex)
を取り出します。

**Exports**: `computeHash`, `getCache`, `setCache`, `cacheStats`。
**Imports**: `crypto` (Node 組み込み)、`template.ts` (型のみ)。

## `src/semaphore.ts` — 同時実行制御

30 行の async セマフォ。`acquire()` は容量内なら即座に戻り、容量超過なら
リゾルバを FIFO キューに push。`release()` がキューの先頭を pop してリゾルブ。

**Exports**: `Semaphore` クラス。
**Imports**: なし。

## `src/examples.ts` — 組み込みサンプル

`EXAMPLES` は `{ title, config, width?, height? }` の配列。
次で使われます:

- CLI の `examples` サブコマンド (PNG + JSON ファイル書き出し)
- HTTP `/examples` ギャラリー (`<img src="/render?chart=…">` タグ埋め込み)

新しいサンプルをここに追加すると、CLI 出力ディレクトリとギャラリーページの両方に
自動的に反映されます。

**Exports**: `EXAMPLES`, `buildExamplesHtml()`。
**Imports**: なし。

## `src/version.ts` — バージョン定数

`package.json` から `VERSION` を再エクスポートするだけの 1 行モジュール
(Bun の `await import(..., { type: 'json' })` を使うので `bun build` で
コンパイル時インライン化)。

**Exports**: `VERSION`。
**Imports**: `package.json`。

## `src/llm-docs/` — LLM リファレンスバンドル

Chart.js モジュール 1 つに 1 つの TS ファイル。各ファイルは `doc: string`
(複数行 Markdown スニペット) を export。`llm-docs/index.ts` が集約して
`getLlmDocs()` を公開し、それを `chartjs2img llm` が出力します。

[LLM ドキュメントの追加](./adding-llm-doc) を参照。

### ファイル一覧

| モジュールファイル             | 対象                                                          |
| ------------------------------ | ------------------------------------------------------------- |
| `usage.ts`                     | chartjs2img の呼び出し方、JSON vs HTTP の違い                 |
| `chartjs-core.ts`              | Chart.js コア: タイプ、データセット、スケール、title/legend/tooltip |
| `plugin-datalabels.ts`         | chartjs-plugin-datalabels のオプション                        |
| `plugin-annotation.ts`         | chartjs-plugin-annotation のオプション                        |
| `plugin-zoom.ts`               | chartjs-plugin-zoom のオプション                              |
| `plugin-gradient.ts`           | chartjs-plugin-gradient のオプション                          |
| `chart-matrix.ts`              | matrix / ヒートマップ チャートタイプ                          |
| `chart-sankey.ts`              | sankey チャートタイプ                                         |
| `chart-treemap.ts`             | treemap チャートタイプ                                        |
| `chart-wordcloud.ts`           | wordcloud チャートタイプ                                      |
| `chart-geo.ts`                 | choropleth + bubbleMap チャートタイプ                         |
| `chart-graph.ts`               | graph / forceDirectedGraph / dendrogram / tree チャートタイプ |
| `chart-venn.ts`                | venn + euler チャートタイプ                                   |
| `adapter-dayjs.ts`             | 時間軸用 dayjs 日付アダプタ                                   |

## 依存グラフ (ざっくり)

<img src="/diagrams/module-deps.svg" alt="モジュール依存グラフ: index.ts が server.ts と cli.ts をディスパッチし、両者が renderer.ts を呼ぶ。renderer.ts は template.ts / cache.ts / semaphore.ts に依存。cli.ts は examples.ts も参照。llm サブコマンド用に llm-docs/index.ts が多数の llm-docs/*.ts を束ねる。" />

<!-- 図の元データ: docs/diagrams/module-deps.gg（`bun run docs:diagrams` で再生成） -->

循環依存なし。`server.ts` と `cli.ts` は `index.ts` 以外から import されません —
エントリポイントを薄く保つため。
