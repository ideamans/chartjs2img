---
title: 開発者ガイド
description: コントリビューター向けガイド - リポジトリ構成、最初に読むべき場所、chartjs2img の拡張方法。
---

# 開発者ガイド

リポジトリをクローンして chartjs2img を読み解き・拡張したい時の道標。
変更の種類ごとに、どこを見ればいいかをまとめました。

## このプロジェクトの実体

**ヘッドレス Chromium の中で動く Chart.js** の薄いラッパーです:

```
          ┌─────────────────────────────────────────┐
          │     chartjs2img  (Bun + TypeScript)     │
          │                                         │
          │   CLI  ─┐       ┌─  HTTP サーバー        │
          │        ├── renderer.ts ──────┐          │
          │        │                     │          │
          │        │  semaphore + cache  │          │
          │        │                     │          │
          │        └── puppeteer-core ───┘          │
          │                    │                    │
          │                    ▼                    │
          │         ヘッドレス Chromium              │
          │         (Chart.js + 12 プラグイン)       │
          └─────────────────────────────────────────┘
```

Node 側のコードは全て `bun --compile` でそのまま 1 バイナリになります —
開発時にビルドステップ不要。

## リポジトリ構成

```
chartjs2img/
├── src/
│   ├── index.ts         # CLI エントリポイント: argv 解析、サブコマンド振り分け
│   ├── cli.ts           # `render` + `examples` CLI の実装
│   ├── server.ts        # `serve` HTTP サーバー (Bun.serve)
│   ├── renderer.ts      # Puppeteer + Chromium ライフサイクル、スクショパイプライン
│   ├── template.ts      # ブラウザ側で読み込まれる静的 HTML テンプレート
│   ├── cache.ts         # メモリ内 LRU + TTL キャッシュ
│   ├── semaphore.ts     # 同時実行制御の小さな async セマフォ
│   ├── examples.ts      # 組み込みサンプル (CLI + ギャラリーで共用)
│   ├── version.ts       # VERSION 定数の唯一のソース
│   └── llm-docs/        # モジュールごとの LLM 向け Markdown 片
│       ├── index.ts     # 集約して getLlmDocs() をエクスポート
│       ├── usage.ts
│       ├── chartjs-core.ts
│       ├── plugin-*.ts
│       ├── chart-*.ts
│       └── adapter-*.ts
├── examples/            # JSON 入力 + PNG 出力 (再生成可能)
├── docs/                # VitePress バイリンガルドキュメント
├── .github/workflows/   # CI
├── Dockerfile
├── package.json
└── README.md
```

コードベースは意図的に小さめ (llm-docs を除くと約 2000 行) — 重い処理は
全て Chromium 内で行われます。コードリーディングで真っ先に読むべきは
通常 `renderer.ts`。

## よくあるコントリビューションの流れ

### 「Chart.js プラグインを追加したい」

[Chart.js プラグインの追加](./adding-plugin) を参照。

### 「プラグイン向けの LLM ドキュメントを追加したい」

[LLM ドキュメントの追加](./adding-llm-doc) を参照。

### 「同時実行数 / キャッシュ / ブラウザ挙動をチューニングしたい」

まず [アーキテクチャ](./architecture) で構成要素を把握し、[モジュール](./modules)
で編集対象のファイルを特定。ほとんどのツマミは環境変数なので再ビルド不要。

### 「レンダリングのバグに当たった」

まずブラウザコンソールを確認。`renderer.ts` の `page.on('console', …)` と
`window.__chartMessages` が Chromium 側と Chart.js 側のエラーの両方を捕捉。
それらは `X-Chart-Messages` (HTTP) または stderr (CLI) で呼び出し元に返ります。
詳しくは [エラーハンドリング](./error-handling) を参照。

## ソースから実行

```bash
bun install
bun run dev              # HTTP サーバーが :3000 で起動
bun run cli -- help      # CLI ヘルプ
bun run cli -- llm       # LLM リファレンス
```

`bun run` はプロジェクト内のバイナリを優先し、コンパイル済みバイナリ
不要。型チェックは `bun run typecheck`。

## ドキュメントサイトをローカル起動

```bash
bun run docs:dev         # VitePress 開発サーバーが :5173 で起動
```

ドキュメントサイトにバックエンドはありません。`docs/en/**` と
`docs/ja/**`、および `docs/.vitepress/config.ts` のサイドバー/ナビ定義を
読むだけ。

## 次のページ

- **[アーキテクチャ](./architecture)** — HTTP から PNG までのリクエストフロー。
- **[モジュール](./modules)** — `src/*.ts` の各ファイル 1 行サマリ。
- **[型と HTTP スキーマ](./types)** — 全インターフェースと全 HTTP ボディ。
- **[Chart.js プラグインの追加](./adding-plugin)** — 3 ファイル変更、10 行未満。
- **[LLM ドキュメントの追加](./adding-llm-doc)** — `chartjs2img llm` にプラグインのオプション表を追加。
- **[エラーハンドリング](./error-handling)** — レンダラエラー / Chart.js エラー / サーバーエラーの違い。
