# chartjs2img リファクタリング前レビュー

対象コミット: `7d76a24` (develop)
レビュー観点: ソフトウェア工学の原則（SRP / DRY / DIP / SoC / 最小知識 / 不変条件 / 失敗の局所化 / テスタビリティ / セキュリティ / API 設計 / 仕様と実装の整合性）。

現行の E2E 出力は `tests/integration/` 配下の統合テスト（TS / CLI / HTTP 三経路×5 フィクスチャ）でピクセル差分 1% 未満の合格条件を満たすことを確認済み。本レビューの指摘を修正する際は、この統合テストが常にグリーンであることを合格条件とする。

> **対応状況（末尾の「対応サマリー」節を参照）**: 全 P0 と大半の P1 / 選択した P2 を
> `refactoring` ブランチで解消済み。一時統合テストは refactor 完了時点で削除し、
> 代わりに `tests/unit/` に恒久ユニットテスト 25 件を追加した。

---

## 重大度の定義

- **P0** … 利用者に見える誤り / セキュリティ事故の種。先に直すべき。
- **P1** … 設計上の負債。拡張・保守・テストの障害。リファクタで解消。
- **P2** … スタイル／可読性／軽微な非一貫性。余裕があれば。

---

## P0: 仕様と挙動の乖離 / セキュリティ

### P0-1. `/examples` が API キーをレスポンス本文に埋め込んでいる（秘密情報リーク）

`src/server.ts:83-87` の `/examples` エンドポイントは `checkAuth` を通さず、
`buildExamplesHtml(baseUrl, config.apiKey, VERSION)` を返す。`src/examples.ts:853`
にて以下の JS が HTML に直接埋め込まれる。

```js
const API_KEY = ${JSON.stringify(apiKey ?? '')};
```

結果として、`API_KEY` を設定して運用していても、`/examples` を GET した任意の
クライアントが HTML ソースからキーを取得できる。ギャラリー機能のために
認証を完全に回避していること自体が根本原因。

**修正案:**

1. `API_KEY` 設定時はギャラリー画面で `X-API-Key` ヘッダを使わせず、プロキシとして
   動作する内部エンドポイント（例: `/examples/proxy/:index`）を介して画像を返す。
2. もしくは `/examples` 自体も `checkAuth` を通す（ただし HTML に鍵を埋め込むのは
   やめる — ブラウザ側で fetch する際は Cookie/セッションなど別方式に）。
3. 最小対応としては、`buildExamplesHtml` から `apiKey` 引数を削除し、
   `API_KEY` が設定されている運用では `/examples` を 503 または 404 に倒す。

### P0-2. `format: 'webp'` は実際には PNG を返す（虚偽の Content-Type）

`src/renderer.ts:415` は Puppeteer の制約を回避するために `type: format === 'webp' ? 'png' : format`
と置き換えるが、`src/renderer.ts:345` で `contentType` は `image/webp` のまま。
戻り値 `buffer` は PNG シグネチャ `89 50 4e 47` を持つのに `Content-Type: image/webp` が
付与されるため、以下が発生する:

- HTTP レスポンス: `Content-Type` とマジックナンバーが不一致。一部ブラウザ・
  画像ライブラリで読み取り不能。
- CLI: `--format webp -o chart.webp` で出力すると拡張子が `.webp` でも中身は PNG。
- ライブラリ API: `result.contentType` を信じて保存すると壊れる。

仕様は `README.md` と `printUsage()` で `png | jpeg | webp` と広告している。

**修正案:**

- `puppeteer-core` は WebP 直接サポートしない。`sharp` などで PNG → WebP を
  トランスコードするか、**サポート対象から webp を外す**（最小変更）。後者なら
  `CONTENT_TYPES` / `printUsage` / `README.md` / `llm-docs/usage.ts` を同期して削除。

### P0-3. 入力不備エラーが HTTP 500 として返る

`src/server.ts:117-163` の try-catch は `parseRenderOptions` が投げる
`Missing required field: chart` も `JSON.parse` のエラーも、どちらも 500 として返す。
これは呼び出し側から見れば「サーバが壊れた」ため、監視・アラートの誤検知を誘う。

**修正案:** 検証エラー（Zod などのランタイム検証 or 明示的な `ValidationError`
クラス）と実行時エラーを分離し、前者は 400 として返す。

### P0-4. `examples.ts` の treemap フォーマッタは実行されない（仕様未達 / サイレント失敗）

`src/examples.ts:348` の treemap 例には

```ts
formatter: (ctx: unknown) => `Item ${(ctx as { dataIndex: number }).dataIndex + 1}`,
```

という関数値が含まれる。`src/template.ts:81` で `var config = ${JSON.stringify(chart)};`
により関数は `undefined` に欠落する。結果、ラベルが `Item 1 / Item 2 ...` として
出ない。組み込みの手本が動作していない。

**修正案:**

- treemap 用にラベル文字列を配列で指定する（`data.labels`）構成に例を書き換える。
- もしくは「関数は受け付けない」旨を `README.md` と `llm-docs` に明記し、
  組み込み例も JSON セーフに統一する。後者を推奨。

---

## P1: 設計上の負債

### P1-1. `renderer.ts` が 4 つの責務を持つ神モジュール (465 行)

現状、`src/renderer.ts` は以下のすべてを抱える:

1. Chromium のシステム走査 (`findChromiumExecutable`, 80 行)
2. Chrome for Testing の自動ダウンロード・展開 (`downloadChromeForTesting`, 86 行)
3. `puppeteer-core` の Browser ライフサイクル管理（モジュールレベルの可変状態）
4. Page ライフサイクル管理（孤児化タイマー）
5. レンダリング API `renderChart` 本体

単一責任原則 (SRP) 違反。加えてテスト容易性を著しく損ねる:

- モジュール変数 `browser, launching, launchPromise, chromiumPath, activePages` が
  シングルトン状態を形成し、テストで差し替え・リセット不能。
- 複数の Renderer インスタンスを同プロセスで動かせない（将来 ワーカープール化 /
  テナント分離したくなっても不可）。
- Chromium 発見ロジックの単体テストができない。

**修正案（提案構成）:**

```
src/
  chromium/
    discover.ts     # findChromiumExecutable（純粋関数化, DI で fs を渡す）
    install.ts      # downloadChromeForTesting
    index.ts        # ensureChromiumInstalled
  browser/
    lifecycle.ts    # Browser プロビジョナ（クラス化, new BrowserPool({maxConcurrency, pageTimeoutMs, chromium}) 相当）
  renderer.ts       # renderChart (BrowserPool を注入)
```

クラス化することで `closeBrowser()` グローバル副作用もオブジェクト所有になる。

### P1-2. `startServer` が停止手段を返さない → テスト・組み込みが困難

`src/server.ts:58-186` の `startServer` は `Promise<void>` を返すが、中の
`Bun.serve(...)` の参照は外に出ず、`process.on('SIGINT'/'SIGTERM')` が
**プロセス全体の**シグナルハンドラを登録するだけ。結果:

- 親プロセスから「サーバを止める」手段がない（プロセスを殺すしかない）。
- 同一プロセスで `startServer` を二回呼ぶとシグナルハンドラが累積する（リーク）。
- 統合テスト側で `void startServer(...)` と投げ捨てないと動かせない
  （本レビューで組んだテストでも回避策として `void` を使っている）。

**修正案:**

```ts
export interface ServerHandle { port: number; stop(): Promise<void> }
export async function startServer(config: ServerConfig): Promise<ServerHandle>
```

シグナルハンドラの登録は CLI (`src/index.ts`) 側の責務に移す。ライブラリ
（`lib.ts` 経由）として公開するかは別議論だが、少なくとも CLI/テストの
両方から使えるインターフェースにする。

### P1-3. `activePages` のタイマーが「安全網」から「ハード締切」に化ける

`src/renderer.ts:295-308` の `schedulePageCleanup` は `PAGE_TIMEOUT_MS`
（デフォルト 60 秒）後に無条件で `page.close()` する。これはレンダリング本体の
処理中でも発火するため、正常系でも 60 秒を超える描画（超巨大データセット・
外部 CDN 遅延等）では画面撮影中に Page が閉じられてスクリーンショットが失敗する。

意図は「孤児化タブの強制解放」のはずだが、実装上は「全レンダリングの
バックアップタイマー」と衝突している。`renderChart` 内での `page.goto` / `waitForFunction`
の `timeout: 30000` と意味が被っており、時間境界の責務が散逸している。

**修正案:**

- `renderChart` のフロー上では `page.close()` を `finally` で確実に実行しているので、
  そのパスで閉じた page を `activePages` から必ず外す（現状は外している）。
- `activePages` 側のタイマーは「Finally が走らなかった場合の保険」であることを
  コメントで明示し、値を `PAGE_TIMEOUT_MS`（既定 60s）ではなく **ページ閉鎖 Finally が
  完走する現実的上限 + マージン**（例: `goto/timeout + waitForFunction/timeout + 10s`
  ≒ 70s）に導出する。環境変数一本で手動管理せず、`config.maxRenderTimeMs` のような
  明示入力から計算する。
- あるいは `renderChart` 内で Promise.race し、タイムアウト側で page.close を
  呼ぶ一貫したパターンにし、モジュールレベルの `activePages` を撤廃する。

### P1-4. グローバルシングルトン全般（browser, cache, semaphore）

`src/cache.ts:10` / `src/renderer.ts:15,17` / `src/semaphore.ts` はいずれも
モジュール内に可変状態を保持。CLI の 1 プロセス 1 レンダーなら問題ないが、

- HTTP サーバ多重化・テストコンテキストでは干渉する。
- `closeBrowser()` がグローバル副作用として library API から公開されている
  （利用側が「自分の分だけ止める」ことができない）。

**修正案:** Chromium / Cache / Semaphore をコンストラクタ引数で受け取る
`Renderer` クラスに集約し、`renderChart()` は「デフォルトインスタンスへのショートカット」
にする。TypeScript ライブラリ利用者は `new Renderer({ cache, concurrency })` で
独自運用できる。

### P1-5. `index.ts` の自前 `parseArgs` が脆い

`src/index.ts:218-234`:

- `next.startsWith('-')` でフラグ値を次トークンから取るため、`render -w -100` のように
  負数を指定すると値が取れない。
- `Number(args['width'])` の手動変換が CLI 呼び出し側ごとに散在し、かつ `undefined`
  時の既定値はさらに別の層（`renderChart` 内の `options.width ?? 800`）に分散。
- `help` / `--help` / `-h` の衝突（`-h` は `render` サブコマンドでは `--height`、
  トップレベルでは `--help`）。現状は起動時に `command` を先に判定して回避しているが、
  将来 command 名追加時のハザード。

**修正案:** `bun:cli`, `citty`, `yargs`, `commander`, `mri` など既存の小さい
ライブラリを採用するか、少なくとも `render`/`serve`/`examples` 各コマンド
ごとに引数スキーマ（型・必須・エイリアス・変換関数）を宣言する。

### P1-6. `lib.ts` と `server.ts` の輸入ルートが不一致（内部モジュールへの直接参照）

- `server.ts:5` は `./lib` から `renderChart, closeBrowser, rendererStats` を取る。
- 一方 `server.ts:7` は `./cache` から `getCache, cacheStats` を **直接** 取る。
- 同様に `./examples` の `buildExamplesHtml` も直接。

`lib.ts` は外部公開面だが、内部ファイル間では lib を経由したり経由しなかったり。
DIP の崩れ。

**修正案:** 「外部用の面（`lib.ts` の再輸出）」と「内部用の面（直接インポート）」を
明確に分ける。内部サブモジュールは全部直接インポート（`lib.ts` をバイパス）。
`lib.ts` は外部公開専用。

### P1-7. 汎用定数の重複: `CONTENT_TYPES`

`src/renderer.ts:322-326` と `src/server.ts:52-56` で同一の `CONTENT_TYPES` を
別定義。P0-2 の webp 問題は片方だけ直すと不整合になる温床。

**修正案:** `src/mime.ts` に一本化するか、`RenderResult.contentType` を源泉に
HTTP 側は参照のみにする（`server.ts` の `CONTENT_TYPES` 定義を削除できる）。

### P1-8. `examples.ts` (933 行) がデータとプレゼンテーションを同居

- `EXAMPLES: ExampleChart[]` というデータ定義
- `buildExamplesHtml(...)` という HTML ジェネレータ

の 2 責務を同一ファイルに詰めており、さらに後者は 100 行超のテンプレート文字列で
ブラウザ JS を内包する。SSOT 方針でデータを 1 箇所にまとめる意図は理解できるが、
プレゼンテーション層は別ファイルにすべき。

**修正案:**

```
src/
  examples/
    data.ts      # EXAMPLES 配列のみ export
    gallery.ts   # buildExamplesHtml(templates + data)
    index.ts
```

### P1-9. `renderChart` 内の in-page セマフォ再取得とキャッシュ二重確認

`src/renderer.ts:354-362` の「セマフォ取得後にキャッシュ再確認」は正当な
ダブルチェックロックパターンだが、セマフォ未取得時点の最初のチェック
（`src/renderer.ts:348`）でキャッシュヒットしたら即 return してしまうため、
「hash 計算中に別の同一リクエストが到着」したときにしか二重目のチェックは
効かない。責務分離上、キャッシュ層を `Cache` インターフェースとして外出しし、
「セマフォ取得は Cache.miss に限定する」流れに整理するとテストしやすい。

### P1-10. テスト資産がリポジトリに存在しない

`tests/` が元から無く、本レビューで初めて統合テストを追加した。リファクタリングを
継続的に安全に行うには、**残すべき最低限のテスト**を用意すべき:

- Chromium 発見ロジックの純粋関数ユニットテスト（モック fs）
- `computeHash` の決定性テスト（キー順序への耐性を含む）
- セマフォの並列挙動テスト
- HTTP ルータの契約テスト（認証・エラーマッピング）

現在の一時統合テストは refactor 完了時に削除予定だが、上記ユニットテストは
**今後も残す**ほうが健全。

---

## P2: 可読性 / 軽微

### P2-1. `cache.ts` の `computeHash` がキー順序に依存

`JSON.stringify({ chart, width, height, ... })` は `options.chart` 内の
オブジェクトキーの順序に依存。`{type:'bar', data:{...}}` と `{data:{...}, type:'bar'}`
で hash が異なる → 同一 render が複数キャッシュ行を占める。

**修正案:** 深いソート後に stringify する小さなヘルパを追加。

### P2-2. `semaphore.ts` に release の不均衡検出がない

`release()` を余分に呼ぶと `running` が負になり、`acquire()` の `running < max` が
常に true になる。防御的に `Math.max(0, running-1)` か、`active == 0` 時に
`console.warn` するくらいは入れてもよい。

### P2-3. ログの経路が統一されていない

`console.log` と `console.error` が混在。server と renderer と CLI で出力先が
別プロセス流儀のまま。最小限 `logger.ts` に集約し、`LOG_LEVEL` 環境変数を使うと
Docker/Kubernetes 運用でノイズ抑制が効くようになる。

### P2-4. `RenderOptions.quality` が webp/jpeg 共通の扱い

webp を正式サポートするなら `type.ts` で `quality` は jpeg/webp のみ意味があることを
型で表現（discriminated union）すると使いやすい。ここは P0-2 の決着次第。

### P2-5. `template.ts` の Plugin 登録コードが HTML テンプレ内ベタ書き

`Chart.register(ChartDataLabels)` や `ChartGeo` の条件分岐はテンプレートに
ベタ書かれており、テスト不能。HTML 生成を「head の script タグ群」と
「本体 IIFE」に分離し、本体 IIFE は `src/template/boot.js` 等に切り出す
（単体で静的検証可能）。

### P2-6. `index.ts` の巨大ヘルプ文字列

`printUsage()` の 200 行を超えるテンプレ文字列は AI artifact policy により
SSOT として維持しているが、セクションごとに定数分割すれば diff と可読性が両立する:

```ts
const USAGE_HEADER = `...`
const USAGE_SERVE = `...`
const USAGE_RENDER = `...`
function printUsage() { return [USAGE_HEADER, USAGE_SERVE, ...].join('\n') }
```

### P2-7. コメントで既に "TODO" 気味の文言が複数

- `src/renderer.ts:388-389`「puppeteer's setContent does not reliably handle...」:
  対処済みだが「なぜ data URL か」の理由説明として恒久的にコメントを残すべき。
- `src/template.ts:17-18`「These four publish UMD under build/, not dist/」:
  既にコメントあり。OK。

### P2-8. `cli.ts` の `slugify` は `examples.ts` が書き出す JSON ファイル名を決定

`cli.ts:82-87` の `slugify` は非 ASCII（日本語ラベル含むタイトル）を空文字化する。
「Japanese Labels (日本語テスト)」→ `japanese-labels-`（末尾ハイフン除去で `japanese-labels`）。
壊れないが、ローマ字タイトル前提であることは明示しておくと良い。

---

## セマンティクスの整合性マトリクス

| ドキュメントの主張                                   | 実装 | 状態 |
| ---------------------------------------------------- | ---- | ---- |
| `png / jpeg / webp` サポート                         | webp は PNG を返す | **壊れている (P0-2)** |
| `/examples` は API キー不要で閲覧可                  | 閲覧できるが鍵を漏洩 | **セキュリティ欠陥 (P0-1)** |
| 組み込み例「Treemap Chart」がラベル表示              | formatter は JSON 化で消失 | **仕様未達 (P0-4)** |
| `X-Cache-Hit` ヘッダ                                 | 実装あり | OK |
| `X-Chart-Messages` で Chart.js のエラー/警告を返す   | 実装あり、`index.ts` にも記載 | OK |
| 認証: Bearer / X-API-Key / ?api_key                  | 3 方式とも実装 | OK |

---

## 推奨リファクタ順序（漸進的に行い、各段階で統合テスト維持）

1. **P0-1, P0-2, P0-4 を先に片付ける**（利用者視点のバグ・セキュリティ）。
2. **P1-7 (`CONTENT_TYPES` 重複) / P1-6 (import 経路整理)** → 軽微だが 1 の土台。
3. **P1-2 (`startServer` が handle を返す)** → これ以降のテストが楽になる。
4. **P1-1 (`renderer.ts` 分解)** → ここが最大の負債。
   - まず `chromium/discover.ts` と `chromium/install.ts` を純粋関数化。
   - 次に `Renderer` クラス化 (`browser / cache / semaphore` を DI)。
   - レガシーの `renderChart` は内部デフォルトインスタンスを使う thin wrapper に。
5. **P1-3 (timeout 責務集約)** → Renderer クラスに移った後の方が安全。
6. **P1-5 (arg parser)** → 動作変化が無いよう CLI のサブコマンド単位で差し替え。
7. **P1-8 (`examples.ts` 分割)** → 最後でもよい。
8. **P1-10 (ユニットテスト追加)** → P1-1 後にコンポーネント単位で追加する。

各段階終了時に `bun test tests/integration/three-interfaces.test.ts` が
グリーン（PNG 差分 < 1%）であることを必須条件とする。

---

## 今回の一時統合テストについて

- パス: `tests/integration/three-interfaces.test.ts`
- 依存: `compare` (ImageMagick)
- ゴールデン: `tests/integration/baseline/*.png`（TS ライブラリ経由で生成済み）
- カバレッジ: 5 フィクスチャ × 3 インターフェース = 15 ケース
- 合格基準: ピクセル差分 < 1% (fuzz 1% 適用後)

リファクタリング完了時点で `tests/integration/` は削除した。代わりに
Chromium を起動しない恒久ユニットテスト（`tests/unit/`、25 ケース、
`cache` / `Semaphore` / サーバ validation + auth）を追加し、これらは
今後も CI で実行する。

---

## 対応サマリー

リファクタリングは `refactoring` ブランチで段階的に実施。各ステップ
ごとに統合テスト 15 / 15 グリーン（PNG 差分 < 1%）を確認してから
コミットした。

| ID    | 内容                                                                       | コミット  | 状態 |
| ----- | -------------------------------------------------------------------------- | --------- | ---- |
| P0-1  | `/examples` の API キー漏洩                                                | `7bb94ac` | ✅   |
| P0-2  | webp の虚偽 Content-Type                                                   | `0f4f087` | ✅   |
| P0-3  | 入力不備が HTTP 500 として返る                                             | `4855c26` | ✅   |
| P0-4  | treemap formatter が JSON 化で消失                                         | `046f534` | ✅   |
| P1-1a | Chromium 発見・導入を `src/chromium.ts` へ分離                             | `50f363a` | ✅   |
| P1-1b | Renderer クラス化、module 可変状態を撤去（P1-4 も包含）                    | `80b0aec` | ✅   |
| P1-2  | `startServer` が `ServerHandle` を返す、シグナル登録は CLI 層へ            | `0b60134` | ✅   |
| P1-3  | `maxRenderTimeMs` / `pageSafetyNetMs` に責務分離                           | `47619db` | ✅   |
| P1-5  | CLI arg parser を VALUE\_FLAGS ホワイトリスト方式に                        | `ecf2ae8` | ✅   |
| P1-6  | 内部ファイルは `./lib` を経由せず直接 import                               | `6b93677` | ✅   |
| P1-7  | `CONTENT_TYPES` 重複 / dead code を削除                                    | `6b93677` | ✅   |
| P1-8  | `examples.ts` からプレゼン層を `examples-gallery.ts` へ分離                | `ec894d8` | ✅   |
| P1-9  | キャッシュ層の DI 化                                                       | (部分対応) | ◐  |
| P1-10 | 恒久ユニットテスト追加（`tests/unit/` 25 件）                              | (追加分)  | ✅   |
| P2-1  | `computeHash` をキー順不変に                                               | `4461a1d` | ✅   |
| P2-2  | Semaphore `release()` に過剰呼び防御ガード                                 | `4461a1d` | ✅   |

**P1-9** について: Renderer クラス化でセマフォとブラウザは DI 化された
が、in-memory キャッシュの実体は依然としてモジュールレベルの `Map`。
`Renderer` インスタンスごとにキャッシュを分離したい場面は現時点では
ないと判断し、`CacheAdapter` インターフェースの導入は保留（将来の
マルチテナント化で必要になった時点で対応する）。

**未対応の P2 項目** (P2-3 ロガー統一 / P2-4 quality の discriminated union /
P2-5 template 内 boot IIFE 切り出し / P2-6 printUsage 分割 / P2-7 コメント
補足 / P2-8 slugify ASCII 前提): いずれも可読性・将来拡張性の話で、
現在の挙動に問題はない。スコープを抑えるため今回は見送り、別途の
メンテナンス PR で扱う想定。

### テスト / ビルド確認

- `bun test tests/` → 40 pass / 0 fail (25 unit + 15 integration、リファクタリング各段階)
- リファクタ完了時点では `tests/integration/` を削除し `tests/unit/` のみ
  （`bun test tests/` → 25 pass）
- `bun run typecheck` → 通過
- `bun run docs:build` → 通過（llms.txt / llms-full.txt 再生成後）

### ファイル構成の before / after

```
before (src/)                       after (src/)
  cache.ts     (52)                   cache.ts     (72)   + stableStringify
  cli.ts       (123)                  cli.ts       (126)
  examples.ts  (933)  ← 混在          examples.ts  (826)  ← データのみ
                                      examples-gallery.ts (128)  ← 新規 (P1-8)
  index.ts     (292)                  index.ts     (345)  + VALUE_FLAGS / signal
  lib.ts       (49)                   lib.ts       (55)   + Renderer re-export
  renderer.ts  (465)  ← 神             renderer.ts  (377)  ← Renderer class のみ
                                      chromium.ts  (236)  ← 新規 (P1-1a)
  semaphore.ts (34)                   semaphore.ts (42)   + guard
  server.ts    (186)                  server.ts    (235)  + ServerHandle / 400
  template.ts  (147)                  template.ts  (147)
  version.ts   (4)                    version.ts   (4)
  llm-docs/... (変更なし)             llm-docs/... (usage.ts 微修正)
```
