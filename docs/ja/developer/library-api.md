---
title: ライブラリ API (TypeScript)
description: 任意の Bun または Node プログラムから chartjs2img を import し、CLI や HTTP サーバーを経由せずに Chart.js 設定を画像化する。
---

# ライブラリ API (TypeScript)

chartjs2img は CLI と HTTP サーバーに加えて、小さな **TypeScript /
Node ライブラリ** の surface を公開しています。CLI とサーバーはどちらも
このライブラリの薄いラッパー — どのエントリから呼んでも描画挙動は同じです。

## ライブラリを直接使うべき場面

- 既に Bun / Node サービス内にいて、CLI の spawn や sidecar への HTTP 呼び出しのオーバーヘッドなしで Chart.js を描画したい。
- HTTP サーバーが設定として露出していない方法で、リクエスト検証・キャッシュ・エラーハンドリングをカスタマイズしたい。
- ビルド時のスクリプトで描画したい (例: メール配信キャンペーン用のダッシュボードスナップショット生成)。

これらに当てはまらなければ、HTTP または CLI の方が運用はシンプルです。
[HTTP サーバー](/ja/guide/http/) / [CLI レンダリング](/ja/guide/cli/) を参照。

## インストール

```bash
# npm から (公開後)
bun add chartjs2img
# または
npm install chartjs2img

# ソースから (開発時)
git clone https://github.com/ideamans/chartjs2img
cd chartjs2img
bun install
bun run build:lib   # ./dist/*.js + *.d.ts を生成
```

Chromium は npm パッケージの依存 **ではありません**。レンダラは初回実行時に
Chrome for Testing をユーザーキャッシュに自動ダウンロード (macOS/Windows/Linux-x64)、
もしくは linux-arm64 なら `CHROMIUM_PATH` を読みます。

## クイックスタート

```ts
import { renderChart, closeBrowser } from 'chartjs2img'

const { buffer, hash, cached, messages } = await renderChart({
  chart: {
    type: 'bar',
    data: {
      labels: ['1月', '2月', '3月'],
      datasets: [{ data: [12, 19, 3] }],
    },
  },
  width: 800,
  height: 600,
  format: 'png',
})

await Bun.write('chart.png', buffer)         // Node なら fs.writeFileSync
console.log('rendered', buffer.length, 'bytes — cached?', cached)
if (messages.length) console.warn(messages)   // Chart.js の警告/エラー

// プロセス終了時に:
await closeBrowser()
```

`renderChart` は非同期でブラウザ駆動。初回呼び出しで Chromium が起動 (遅延)、
以降の呼び出しで共有されます。同時実行は `CONCURRENCY` (既定 8) で制限され、
超過分はキュー待ちになります。

## Exports

全 export はパッケージルートから取得できます:

```ts
import {
  renderChart,
  closeBrowser,
  rendererStats,
  computeHash,
  VERSION,
  NAME,
  BUNDLED_LIBS,
  type RenderOptions,
  type RenderResult,
  type ConsoleMessage,
} from 'chartjs2img'
```

### `renderChart(options: RenderOptions): Promise<RenderResult>`

単一の描画エントリポイント。内部動作:

1. 正規化したオプションから SHA-256 ハッシュを計算
2. キャッシュ済みの PNG があれば返却 (`cached: true`)
3. なければセマフォスロットを取得、Chromium を起動 (または再利用)、新しいページを開き、HTML テンプレート + Chart.js + 12 プラグインを注入、canvas をスクリーンショット、結果をキャッシュして返却

### `closeBrowser(): Promise<void>`

共有 Chromium インスタンスと孤児ページを閉じる。プロセス終了時に呼び出し。冪等。

### `rendererStats()`

```ts
{
  browserConnected: boolean
  concurrency: { max: number; active: number; pending: number }
  activePages: number
  pageTimeoutSeconds: number
}
```

自前の `/health` エンドポイントや Prometheus エクスポーターを組むときに使用。

### `computeHash(options: RenderOptions): string`

正規化されたオプション形状から決定論的に計算された SHA-256 の先頭 16 桁 (hex)。
`renderChart` を呼ぶ **前に** 重複排除やキャッシュチェックを行いたい場合に便利:

```ts
const hash = computeHash(options)
if (await redis.exists(`cj:${hash}`)) return redis.get(`cj:${hash}`)
const { buffer } = await renderChart(options)
await redis.set(`cj:${hash}`, buffer, 'EX', 3600)
```

### `VERSION` / `NAME`

`package.json` に一致するランタイム定数。ヘルスプローブやログヘッダーに表示。

### `BUNDLED_LIBS`

描画ページに組み込まれている Chart.js + プラグインのバージョン表 (読み取り専用):

```ts
console.log(BUNDLED_LIBS.chartjs.version)       // "4.4.9"
console.log(BUNDLED_LIBS.datalabels.version)    // "2.2.0"
```

`chartjs2img llm` を解析せずに「バンドル中の Chart.js バージョンは?」を
自ユーザーに surface したい場合に使えます。

## 型

### `RenderOptions`

```ts
interface RenderOptions {
  /** Chart.js 設定オブジェクト (type, data, options, plugins) */
  chart: Record<string, unknown>
  /** キャンバス幅 (ピクセル、既定 800) */
  width?: number
  /** キャンバス高さ (ピクセル、既定 600) */
  height?: number
  /** デバイスピクセル比 (既定 2)。出力ピクセル数を倍にするだけでチャート詳細度は上げない */
  devicePixelRatio?: number
  /** CSS カラー、または "transparent" (既定 "white") */
  backgroundColor?: string
  /** 出力形式 (既定 "png") */
  format?: 'png' | 'jpeg' | 'webp'
  /** JPEG / WebP 品質 0-100 (既定 90) */
  quality?: number
}
```

### `RenderResult`

```ts
interface RenderResult {
  /** 指定形式の画像バイト */
  buffer: Buffer
  /** 組み込みキャッシュのキーとなる SHA-256 先頭 16 桁 (hex) */
  hash: string
  /** `format` に対応する MIME タイプ */
  contentType: string
  /** プロセス内キャッシュから配信されたなら true */
  cached: boolean
  /** 描画中に捕捉された Chart.js コンソールメッセージ */
  messages: ConsoleMessage[]
}
```

### `ConsoleMessage`

```ts
interface ConsoleMessage {
  level: 'error' | 'warn' | 'info' | 'log'
  message: string
}
```

実運用では `error` と `warn` しか現れません。空配列ならクリーンレンダー。

## 環境変数

ライブラリは CLI / サーバーと同じ環境変数を読みます:

| 変数                     | 既定値   | 効果                                                              |
| ------------------------ | -------- | ----------------------------------------------------------------- |
| `CONCURRENCY`            | `8`      | 同時描画上限 (セマフォ容量)                                        |
| `CACHE_MAX_ENTRIES`      | `1000`   | メモリ内 LRU キャッシュのサイズ                                    |
| `CACHE_TTL_SECONDS`      | `3600`   | キャッシュエントリ生存時間                                         |
| `PAGE_TIMEOUT_SECONDS`   | `60`     | 孤児タブをこの秒数で強制クローズ                                   |
| `CHROMIUM_PATH`          | *(なし)* | Chromium バイナリへの明示パス (検出チェーンをスキップ)             |

`renderChart` の初回呼び出し前に設定してください。ランタイムでの再設定は
サポートされていません — 同時実行数を変えたければプロセス再起動が必要。

## エラーハンドリング

ライブラリは Chart.js エラーで throw **しません**。typo のある設定は
空白/欠損画像を返却し、`messages: [{ level: 'error', message: '...' }]`
が付きます。成功を宣言する前に必ず `messages` を確認:

```ts
const result = await renderChart(options)
if (result.messages.some((m) => m.level === 'error')) {
  throw new ChartConfigError(result.messages)
}
```

`renderChart` が **throw する** ケース:

- Chromium 起動失敗 (linux-arm64 でバイナリ欠落、OOM など)
- ページタイムアウト (`PAGE_TIMEOUT_SECONDS` 超過)
- `chart` フィールドが不正 (完全に欠落 — サーバーラッパーも同様にキャッチ)

全体の分類は [エラーハンドリング](./error-handling) を参照。

## 例: ビルド時のダッシュボードスナップショット

```ts
// scripts/snapshot-dashboards.ts
import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import { renderChart, closeBrowser } from 'chartjs2img'

const CONFIGS = readdirSync('./dashboards').filter((f) => f.endsWith('.json'))

for (const file of CONFIGS) {
  const chart = JSON.parse(readFileSync(join('./dashboards', file), 'utf8'))
  const result = await renderChart({ chart, width: 1200, height: 600 })
  const out = file.replace(/\.json$/, '.png')
  await Bun.write(join('./snapshots', out), result.buffer)
  if (result.messages.length) {
    console.warn(file, result.messages)
  }
}

await closeBrowser()
```

`bun run scripts/snapshot-dashboards.ts` で実行。共有 Chromium インスタンスが
ループ全体を通して起動したままなので、100 件のダッシュボードは
「ブラウザ 1 回起動 + 100 × 各チャートの時間」で完了します。

## 例: Express ハンドラ

```ts
import express from 'express'
import { renderChart, closeBrowser } from 'chartjs2img'

const app = express()
app.use(express.json({ limit: '1mb' }))

app.post('/chart.png', async (req, res) => {
  try {
    const result = await renderChart({
      chart: req.body.chart,
      width: req.body.width,
      height: req.body.height,
      format: 'png',
    })
    if (result.messages.length) {
      res.setHeader('X-Chart-Messages', JSON.stringify(result.messages))
    }
    res.setHeader('Content-Type', 'image/png')
    res.setHeader('X-Cache-Hit', String(result.cached))
    res.send(result.buffer)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

process.on('SIGTERM', async () => {
  await closeBrowser()
  process.exit(0)
})

app.listen(3000)
```

## CLI / HTTP サーバーとの関係

組み込みの CLI (`src/index.ts` / `src/cli.ts`) と組み込みの HTTP サーバー
(`src/server.ts`) は、いずれもこのライブラリの **薄いラッパー** です:

```
┌──────────────────┐     ┌──────────────────┐
│  chartjs2img     │     │  chartjs2img     │
│  (CLI バイナリ)  │     │  (HTTP サーバー) │
└─────────┬────────┘     └────────┬─────────┘
          │                       │
          └─────┬─────────────────┘
                ▼
       ┌─────────────────┐
       │   lib.ts        │   ← 公開 surface
       │   renderChart   │
       │   closeBrowser  │
       │   ...           │
       └─────────────────┘
                │
                ▼
       ┌─────────────────┐
       │   renderer.ts   │   ← 実装 (セマフォ、キャッシュ、
       │   template.ts   │     Puppeteer ライフサイクル、HTML
       │   cache.ts      │     テンプレート)。公開 surface には
       │   semaphore.ts  │     含まれず、マイナーバージョン間で
       └─────────────────┘     変わる可能性あり。
```

`chartjs2img/*` (パッケージルート以外) から import する場合、実装に手を伸ばすことに
なります — これらのパスは semver の対象外です。[Exports](#exports) に列挙された
シンボルに限定してください。
