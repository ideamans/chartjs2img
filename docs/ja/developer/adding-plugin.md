---
title: Chart.js プラグインの追加
description: chartjs2img に新しい Chart.js プラグインを組み込む方法 - 3 ファイル変更と検証手順。
---

# Chart.js プラグインの追加

別の Chart.js エコシステムプラグイン (新しいチャートタイプ、新しい装飾器)
を同梱して、ユーザーが追加セットアップなしで設定から使えるようにします。

## 3 ファイル変更

### 1. `template.ts` に追加

`src/template.ts` の `LIBS` オブジェクトを拡張:

```ts
export const LIBS = {
  // ...既存エントリ...
  myNewPlugin: {
    pkg: 'chartjs-chart-mynew',      // npm パッケージ名
    version: '1.2.3',                 // バージョンを明示的に固定
    file: 'dist/chartjs-chart-mynew.min.js', // UMD ビルドパス
  },
} as const
```

テンプレート内の `Object.values(LIBS).map(cdnUrl)` が自動的に
`<script src="…">` タグを吐きます。ここ以外の編集は不要。

プラグインが **自動登録しない** 場合は、テンプレートの IIFE 内にも一行追加:

```ts
// 同じ template.ts ファイル内の IIFE 内
if (window.ChartMyNew) {
  Chart.register(ChartMyNew);
}
```

ほとんどのコミュニティプラグインは自動登録します。プラグインのドキュメントが
明示的に `Chart.register(…)` を要求する場合のみこの行を追加。

### 2. LLM ドキュメントを追加

`src/llm-docs/plugin-mynew.ts` (チャートタイプなら `chart-mynew.ts`) を作成:

```ts
export const doc = `
## My New Plugin (chartjs-chart-mynew)

\`chart.type: "mynew"\` を有効化。<何を可視化するか> に利用。

### オプション

| オプション                          | 型       | 既定値    | 説明                       |
| ----------------------------------- | -------- | --------- | -------------------------- |
| \`options.plugins.mynew.foo\`       | string   | \`"bar"\` | ...                        |

### 例

\`\`\`json
{
  "type": "mynew",
  "data": { ... }
}
\`\`\`
`
```

そして `src/llm-docs/index.ts` に登録:

```ts
import { doc as chartMyNew } from './chart-mynew'

const docs = [
  // ...既存...
  chartMyNew,
]
```

完全なテンプレートと表記慣習は [LLM ドキュメントの追加](./adding-llm-doc) を参照。

### 3. サンプルを追加

`src/examples.ts` の `EXAMPLES` に新エントリを追記:

```ts
{
  title: 'My New Chart',
  config: {
    type: 'mynew',
    data: {
      // ...現実的なサンプルデータ...
    },
    options: {
      plugins: {
        title: { display: true, text: 'My New Chart サンプル' }
      }
    }
  },
  width: 800,
  height: 600,
},
```

新エントリは自動的に次の両方に反映されます:

- `chartjs2img examples -o ./out` の出力ディレクトリ
- `GET /examples` ギャラリーページ

## 検証

```bash
# 1. 型チェック
bun run typecheck

# 2. 新しいサンプルを単独レンダリング
bun run cli -- render < <(jq '.[-1].config' <(cat src/examples.ts | ...)) -o /tmp/new.png
# より簡単: examples CLI を実行して最後のファイルを確認
bun run cli -- examples -o /tmp/out
ls /tmp/out | tail

# 3. chartjs2img llm に新セクションが現れるか確認
bun run cli -- llm | grep -A 5 "My New Plugin"

# 4. HTTP サーバーを起動して curl で検証
bun run dev &
curl -X POST http://localhost:3000/render \
  -H 'Content-Type: application/json' \
  -d '{"chart":{"type":"mynew","data":{...}}}' \
  -o /tmp/mynew.png
open /tmp/mynew.png
```

レンダリング結果が真っ白、または `X-Chart-Messages: [{"level":"error",…}]`
が出る場合、プラグインが正しく登録されていない可能性が高い。確認ポイント:

1. このプラグインは `Chart.register(…)` が必要か？
2. UMD グローバル名が正しいか (ステップ 1 の `window.ChartMyNew` の部分)?
3. `LIBS` に含まれていないピア依存を必要としていないか？

## バージョン更新

新機能 (新チャートタイプ、新プラグイン) なら、`package.json` のマイナー
バージョンを上げます。バグ修正や運用改善のみの場合はパッチバージョンに留める。

`version.ts` の再エクスポートは自動的に `chartjs2img --version`、
`X-Powered-By` ヘッダー、`/health` ペイロードに伝播します。

## ドキュメントも忘れずに

- ユーザー向け [同梱プラグイン](../guide/plugins) 表に新行を追加。
- `README.md` のプラグイン表。

これらは現状手動メンテ。将来 `docs/public/llms-full.txt` を `src/llm-docs/`
から自動生成する計画は PLAN.md Phase 2-B に。
