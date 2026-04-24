# PLAN.md — chartjs2img docs + LLM 横展開計画

gridgram で実装済みの「AIエージェント親和化一式」を chartjs2img に導入する。一次資料は
`LLM.md`（ルート）と `/Users/miyanaga/dev/gridgram/` の本体。

ゴールは、**chartjs2img を使いたい人間と AI エージェントが同じ入口から必要な情報に辿り着ける**状態を作ること。具体的には:

- VitePress ベースの英日バイリンガル docs サイト（/ → /en/ か /ja/）
- `docs/public/llms.txt` + `llms-full.txt`（llmstxt.org 規約）
- `context7.json`（context7 MCP 登録用）
- `plugins/chartjs2img/` の Agent Skills 配布物（Claude Code / gh skill 兼用）
- `.claude/rules/` + `.claude/skills/regen-ai/`（プロジェクト内エージェントのずれ防止）
- 既存の `chartjs2img llm` / `src/llm-docs/**` を SSOT として活かす

---

## 0. 作業ブランチ戦略

| ブランチ | 内容                                                                 |
| -------- | -------------------------------------------------------------------- |
| `docs`   | VitePress サイト（Phase 1 群） — 純粋にドキュメント整備だけ完結させる |
| `llm`    | `docs` を派生元に、LLM 対応一式（Phase 2 群）を追加                  |

`docs` を先に完了・コミットし、そのうえで `llm` を派生させる。main にマージするかは最後に
ユーザー確認。push は user 明示指示があるまで行わない。

---

## 1. gridgram との差分・前提

chartjs2img は **DSL を持たない**（入力は Chart.js 設定 JSON）。したがって gridgram と同じ
構造を踏襲しつつ、「DSL パーサ・文法」「アイコン検索」は chartjs2img に存在しないので
代わりに次を据える:

| gridgram の概念         | chartjs2img の対応                                                        |
| ----------------------- | ------------------------------------------------------------------------- |
| `.gg` grammar (SSOT)    | **Chart.js 設定 JSON のスキーマ** + 12 プラグインの options（既存 `src/llm-docs/**`）|
| `gg icons` 検索         | **plugin / chart-type 一覧の説明**（固定リストで十分。検索 CLI は不要）   |
| `gg llm`                | **既存の `chartjs2img llm`** をそのまま SSOT バンドルとして再利用         |
| `icon-tags.json` 追補   | （対応物なし — Chart.js プラグインは有限で追加語彙が不要）               |
| `src/generated/**` 派生 | **`src/llm-docs/` 自体が SSOT**。別途生成物は作らず、`chartjs2img llm` を docs:build 前に呼んで `docs/public/llms-reference.md` に書き出す運用にする |

これにより chartjs2img 側では **生成スクリプトは 1 本（build-llms-txt.ts）で済む**。gridgram が
持っていた icon-index / llm-reference は、chartjs2img の場合は `chartjs2img llm` コマンドが
その役割を兼ねているため、新設不要。

### Playwright / Puppeteer の表記統一

README.md には "Playwright" 表記と "puppeteer-core" 表記が混在している（実装は
`puppeteer-core`）。ドキュメント移植の過程で全て `puppeteer-core` 表記に統一する
（別タスクとして扱わず、各ページ作成時に必ずチェック）。

---

## 2. ディレクトリ最終形（docs + llm 両ブランチの合流後）

```
chartjs2img/
├── .claude/
│   ├── rules/
│   │   ├── ai-artifacts-policy.md       # 手編集禁止ポリシー
│   │   └── regen-triggers.md            # src/llm-docs / README 編集時のリマインダ
│   └── skills/
│       └── regen-ai/
│           └── SKILL.md                 # /regen-ai: ai:regen → typecheck
├── .github/
│   └── workflows/
│       ├── test.yml                     # 既存
│       └── docs.yml                     # docs build + plugin validate（新設）
├── context7.json                        # context7 登録用
├── docs/
│   ├── .vitepress/
│   │   ├── config.ts
│   │   └── theme/                       # daisyui-theme を使う最小構成
│   ├── public/
│   │   ├── examples/                    # gitignore（build-docs-examples.ts で生成）
│   │   ├── llms.txt                     # gitignore（build-llms-txt.ts で生成）
│   │   └── llms-full.txt                # gitignore
│   ├── index.md                         # 言語選択トップ
│   ├── en/
│   │   ├── index.md
│   │   ├── guide/                       # User Guide
│   │   ├── developer/                   # Developer Guide
│   │   ├── ai/                          # AI Guide
│   │   └── gallery/                     # Examples ギャラリー
│   └── ja/                              # /en と同じ shape
├── plugins/
│   └── chartjs2img/
│       ├── .claude-plugin/
│       │   └── plugin.json
│       ├── skills/
│       │   ├── chartjs2img-render/SKILL.md
│       │   ├── chartjs2img-author/SKILL.md
│       │   └── chartjs2img-install/SKILL.md
│       ├── README.md
│       └── PUBLISH.md
├── scripts/
│   ├── build-docs-examples.ts           # examples/*.json → docs/public/examples/*.png
│   ├── build-llms-txt.ts                # docs/en → docs/public/llms*.txt
│   └── validate-plugin-skills.ts        # SKILL.md frontmatter 検証
├── src/                                 # 既存の TypeScript ソース（変更なし）
├── LLM.md                               # 既存（横展開プレイブック）
├── PLAN.md                              # 本ファイル
├── README.md                            # 既存。docs ブランチでも手を入れない（docs で吸収）
└── package.json                         # スクリプト追加あり
```

---

## 3. Phase 一覧（/loop で 1 フェーズずつ消化）

各フェーズは「完了条件」で区切る。`docs` と `llm` でブランチを分ける。

### Phase 1 — docs ブランチ（VitePress サイト）

#### Phase 1-A. VitePress 基盤セットアップ
- `bun add -d vitepress vitepress-daisyui-theme vue` （gridgram と同じバージョン帯）
- `docs/.vitepress/config.ts` を gridgram 雛形から複製。以下を削除/調整:
  - gridgram 固有の `.gg` tmLanguage と gg-diagram markdown プラグイン → 削除
  - ideamans トラッキングタグ → 削除（後で本人から追加可否を確認、今は入れない）
  - 強制ライトモードスクリプトはそのまま踏襲
  - サイドバー・ナビは Guide / Developer / AI / Gallery の 4 本（後続フェーズで埋める）
- `package.json` に `docs:dev` / `docs:build` / `docs:preview` を追加
- `.gitignore` に `docs/.vitepress/cache/`, `docs/.vitepress/dist/`, `docs/public/examples/`, `docs/public/llms*.txt`
- **完了条件**: `bun run docs:build` が空ページで通る（dead link は `ignoreDeadLinks: true` で許容しつつも警告ゼロを目指す）

#### Phase 1-B. ランディング + 言語選択トップ
- `docs/index.md`: gridgram と同じ言語選択画面。タイトル「chartjs2img」、タグライン英日それぞれ。
  - 英: "Server-side Chart.js rendering for the AI era"
  - 日: "AI 時代のサーバーサイド Chart.js レンダラ"
- `docs/en/index.md` / `docs/ja/index.md`: hero / features / AI-ready / architecture / finalCta を持つ
  ランディング。`Landing` コンポーネントが daisyui テーマ由来なので、frontmatter の `landing:` キーに
  chartjs2img 用の文言を流し込むだけで成立。
- **完了条件**: `/`, `/en/`, `/ja/` の 3 ルートが描画できる

#### Phase 1-C. User Guide
- 出典: 既存 README.md
- ページ構成（英日共通のファイル名）:
  - `index.md` — Quick start（HTTP Server を 30 秒で立ち上げる）
  - `install.md` — Bun 導入 / Chromium 自動DL / Linux arm64 手順 / Docker
  - `http-api.md` — POST /render / GET /render / GET /cache/:hash / GET /health / GET /examples
  - `cli.md` — serve / render / examples / llm / help サブコマンドの詳細
  - `cache.md` — hash ベースキャッシュの意味と再利用のしかた
  - `auth.md` — API_KEY 環境変数・Authorization/X-API-Key/query パラメータ
  - `error-feedback.md` — X-Chart-Messages / stderr への出力
  - `env-vars.md` — 環境変数一覧（CONCURRENCY, CACHE_*, PAGE_TIMEOUT_SECONDS 等）
  - `docker.md` — Dockerfile / docker-compose / Noto Sans CJK
  - `plugins.md` — 同梱プラグイン一覧（12 本）+ 版数一覧
- **完了条件**: 10 ページが各言語で存在し、サイドバーから辿れる

#### Phase 1-D. Developer Guide
- 出典: `src/*.ts` の実装を読みながら書く
- ページ構成:
  - `index.md` — 内部アーキテクチャ図（README のフロー図を VitePress 用に整形）
  - `architecture.md` — server → auth → cache → semaphore → renderer の流れを節ごとに
  - `modules.md` — cache.ts / renderer.ts / semaphore.ts / server.ts / template.ts / cli.ts の責務表
  - `types.md` — HTTP 入出力 JSON のスキーマ、CLI 引数の表
  - `adding-plugin.md` — Chart.js プラグイン追加の作法（template.ts の CDN 配列、version.ts 更新）
  - `adding-llm-doc.md` — `src/llm-docs/` に 1 ファイル追加 → `src/llm-docs/index.ts` に登録
  - `error-handling.md` — DataError vs System error（README のポリシーを再掲）
- **完了条件**: 7 ページが各言語で存在する

#### Phase 1-E. Gallery（18 examples を可視化）
- `scripts/build-docs-examples.ts` を新設
  - `examples/*.json` を読み、`chartjs2img render` をサブプロセスで呼び出し、`docs/public/examples/*.png` に書き出す
  - docs:build の前に走らせる
- ページ構成（英日共通）:
  - `index.md` — カテゴリ別インデックス
  - `basic.md` — bar / line / pie / doughnut / radar / polarArea / scatter / bubble
  - `composite.md` — horizontal-bar / mixed / stacked / area
  - `decorations.md` — data labels / annotation
  - `exotic.md` — treemap（他プラグインは developer/plugins に詳細）
  - `sizing.md` — small 400x300 / wide 1200x400
  - `i18n.md` — Japanese labels
- **完了条件**: 各 example の JSON + PNG + Chart.js config の抜粋が並ぶ

#### Phase 1-F. ローカルビルド検証 + `docs` ブランチ commit
- `bun run docs:build` が 0 error で通る
- `bun install` で差分が正しく取り込まれる
- deadlink はゼロを目指す（`ignoreDeadLinks: false` に戻す）
- ブランチに `docs: add VitePress bilingual site` でコミット
- **この時点で push は行わない**（ユーザー確認後）

### Phase 2 — llm ブランチ（AI 対応一式）

#### Phase 2-A. `llm` ブランチ作成 + `context7.json`
- `git switch -c llm docs` で派生
- `context7.json`:
  - folders: `docs/en`, `examples`, `src/llm-docs`
  - excludeFolders: `docs/.vitepress`, `docs/public`, `docs/ja`, `node_modules`, `dist`
  - rules（5〜10 本の落とし穴、例）:
    - "Input is Chart.js config JSON. Callbacks/functions (`options.scales.y.ticks.callback`) must be omitted — JSON has no function representation."
    - "Animation is always forced OFF internally for deterministic rendering; do not propose animated configs."
    - "Error/warning feedback from Chart.js is returned via `X-Chart-Messages` (HTTP) or stderr (CLI). Always inspect these before declaring success."
    - "Cache key is SHA-256 over canonicalized input. Identical JSON + size + format returns the cached image with `X-Cache-Hit: true`."
    - "`chartjs2img llm` is the full reference for Chart.js core + 12 bundled plugins. Pipe it as the opening turn of an agent session."
    - "Exit codes: 0 success, non-zero on I/O or argument errors. CLI render writes image to `-o` or stdout (`-`)."
    - "Chromium is auto-downloaded on first run except on linux-arm64 — see the install guide."
- **完了条件**: JSON スキーマで検証しつつ、手動で `https://context7.com/add-package` に貼り付け可能な状態

#### Phase 2-B. `scripts/build-llms-txt.ts` + `docs/public/llms*.txt`
- gridgram 版を移植し、`docs/en/**/*.md` を走査して index / full-concat を吐く
- `docs:dev` / `docs:build` の前に自動実行
- `package.json` の `scripts.ai:regen` は次の通り:
  ```json
  "ai:regen": "bun run cli -- llm > src/llm-docs/.generated-reference.md && bun scripts/build-llms-txt.ts"
  ```
  （`chartjs2img llm` の出力を docs/public/llms-full.txt に連結するため、まず中間ファイルに保存）
- **完了条件**: `curl http://localhost:3000/... | head` 相当の smoke（`docs:dev` で `/llms.txt` が 200）

#### Phase 2-C. `plugins/chartjs2img/`
- `.claude-plugin/plugin.json` — `name`, `description`, `version`（`package.json.version` と一致）
- `skills/` 構成:
  - `chartjs2img-render/SKILL.md` — JSON 受け取り → 画像生成。chartjs2img CLI / HTTP の両方を扱う
  - `chartjs2img-author/SKILL.md` — 要件説明 → Chart.js config JSON 起草 → render 検証。Chart.js JSON 形状 + 同梱プラグインカタログをスキル本体に内包
  - `chartjs2img-install/SKILL.md` — GitHub releases から単一バイナリを導入 + Chromium 自動DL の注意
  - （詳細オプション表が必要なときは `chartjs2img llm` CLI にフォールバック。`-llm` スキル自体は廃止）
- `README.md`, `PUBLISH.md` — gridgram 雛形から流用、marketplace 参照は `ideamans/claude-public-plugins`
- すべて **Agent Skills 標準フィールドのみ**（Claude 拡張は `metadata.claude-code.*` に逃がす）
- **完了条件**: `claude plugin validate plugins/chartjs2img` が ✔

#### Phase 2-D. `scripts/validate-plugin-skills.ts`
- gridgram 版を移植
- チェック項目:
  - SKILL.md 必須 frontmatter (`name`, `description`)
  - `name` とディレクトリ名一致
  - description 長さ (1〜1024)
  - 既知キーワード（"render", "chart", "chartjs2img" 等）を description に含むか
  - `plugin.json.version === package.json.version`
- `bun run validate-plugin-skills` として登録
- **完了条件**: 4 スキル全て pass

#### Phase 2-E. `.claude/rules` + `.claude/skills/regen-ai`
- `ai-artifacts-policy.md`:
  - SSOT 一覧: `src/llm-docs/**`, `README.md`, `docs/en/**`, `examples/*.json`
  - 派生物: `docs/public/llms*.txt`, `docs/public/examples/*.png`, `src/llm-docs/.generated-reference.md`
- `regen-triggers.md`:
  - paths: `src/llm-docs/**`, `src/index.ts` (usage 文字列), `examples/*.json`, `README.md`
  - メッセージ: 「編集したら `/regen-ai` を実行。派生物は直接触らない」
- `regen-ai/SKILL.md`:
  - steps: git status → `bun run ai:regen` → `bun run typecheck` → 報告
- **完了条件**: 3 ファイルが存在し、Claude Code の新規セッションで paths ヒット時に読み込まれる

#### Phase 2-F. AI Guide (docs/{en,ja}/ai/)
- ページ構成（gridgram と同じ shape、文言は chartjs2img 用）:
  - `index.md` — 3 ルート（Claude plugin / gh skill / context7）を並べたランディング
  - `claude-plugin.md` — `/plugin marketplace add` から `/chartjs2img-render` まで一気通貫
  - `gh-skill.md` — `gh skill install` での多ホスト配布
  - `context7.md` — `context7.json` 登録と MCP resolve/query の使い方
  - `llms-txt.md` — `/llms.txt` と `/llms-full.txt` の位置づけ
  - `cli.md` — `chartjs2img llm` のフォーマット、使いどころ
- サイドバー・ナビを config.ts に登録
- **完了条件**: 6 ページが各言語で存在し、AI Guide ナビから辿れる

#### Phase 2-G. package.json + CI
- `package.json` scripts:
  ```
  ai:regen, build-llms-txt, docs:examples, docs:dev, docs:build, docs:preview,
  validate-plugin-skills, typecheck
  ```
- `.github/workflows/docs.yml`:
  - docs ブランチ or PR 時に `bun run docs:build`
  - plugin validate も同じジョブで
- 既存 `test.yml` は触らない（docs / llm でも壊さない）
- **完了条件**: CI の dry-run スクリプトを手元で再現（`act` を使うかは任意、最低限 `bun run typecheck && bun run docs:build` が通る）

#### Phase 2-H. 最終検証 + `llm` ブランチ commit
- LLM.md §8 の横展開チェックリストを節ごとにチェックし、PLAN.md の末尾に「✅ 達成」と「⚠️ 持ち越し」を書き出す
- `bun run typecheck && bun run docs:build && bun run validate-plugin-skills && bun run build-llms-txt` が一発で通る
- `chartjs2img llm | head -30` が期待の見出し構造を出す
- `llm: add context7, plugins, llms.txt, AI Guide` でコミット

---

## 4. 受け入れ基準（Definition of Done）

| 観点                 | 合格条件                                                                         |
| -------------------- | -------------------------------------------------------------------------------- |
| docs ビルド          | `bun run docs:build` が warning/error ゼロ、dead link ゼロ                       |
| 型チェック           | `bun run typecheck` が pass                                                      |
| プラグイン検証       | `bun run validate-plugin-skills` が errors=0 / warnings=0                        |
| Agent Skills 準拠    | 4 つの SKILL.md が標準 frontmatter のみで構成（Claude 拡張は metadata.claude-code.*） |
| llms.txt             | `docs/public/llms.txt` がリンク集形式、`llms-full.txt` が全ページ連結            |
| context7             | `context7.json` が公式スキーマを参照、rules 5〜10 本                              |
| dogfood              | 新規 Claude Code セッションに `chartjs2img llm` を貼って Chart.js config を 1 本 書かせ、実際に `chartjs2img render` で画像が出る |

---

## 5. リスクと回避策

| リスク                                        | 回避策                                                                 |
| --------------------------------------------- | ---------------------------------------------------------------------- |
| VitePress v2 の API が gridgram と非互換      | gridgram と同じ vitepress バージョン（2.0.0-alpha.17）を入れて揃える   |
| `docs/.vitepress/theme/` の daisyui 連携崩れ | 最初は `withTheme()` のみ呼ぶ最小構成で起動確認 → レイアウトを肉付け   |
| examples ビルドで Chromium が遅延        | CI での画像生成は skip、ローカルのみ（`docs:examples` を非 CI 経路に） |
| Claude Code plugin marketplace が未作成       | `ideamans/claude-public-plugins` 作成はユーザーの GitHub 操作が必要。plugin 本体の push までで止め、marketplace は後段 |
| README と docs の二重管理                     | docs 整備後、README は「See https://chartjs2img.ideamans.com/ for full docs」形式に圧縮（Phase 1-F の最後で実施） |

---

## 6. /loop 実行スタイル

- `/loop` は dynamic（self-paced）モード。各ターンで「今のフェーズのサブタスク 1〜2 個」を
  処理して ScheduleWakeup で次ターンを予約。
- 各ターン開始時に `TaskList` で現状確認し、完了フェーズは `TaskUpdate` で closed に。
- ブランチ切り替え時（Phase 1-F → 2-A）は git status をきれいにしてから次ターンに渡す。
- ビルド検証 (docs:build / typecheck) はフェーズ完了ごとに必ず走らせる。
- 予期せぬ大規模な設計変更が必要になったら、/loop を一時停止してユーザーに確認。

---

## 7. 進捗ログ（随時追記）

- 2026-04-23 — Phase 0 完了。docs ブランチ上で本 PLAN.md を commit。
- 2026-04-23 — Phase 1-A, 1-B 完了。VitePress v2.0.0-alpha.17 バイリンガル骨組み構築、`bun run docs:build` が通過。
- 2026-04-23 — Phase 1-C 完了。User Guide 英日 20 ページ執筆、dead link ゼロ。
- 2026-04-23 — Phase 1-D 完了。Developer Guide 英日 14 ページ執筆。`src/*.ts` の実装を読み込み、アーキテクチャ / モジュール / 型 / プラグイン追加 / LLM docs 追加 / エラーハンドリングを起草。
- 2026-04-23 — Phase 1-E 完了。Gallery 14 ページ (7 カテゴリ × 2 言語)。`scripts/build-docs-examples.ts` を追加、`docs:examples` を package.json に登録。18 件の PNG + JSON を `docs/public/examples/` に配置 (gitignore 対象)。
- 2026-04-23 — Phase 1-F 作業中。typecheck 実行時に src/renderer.ts と src/server.ts に pre-existing な型エラー 6 件を発見 (main にも存在)。puppeteer-core v24 の型更新と Bun の Response 型の不整合。最小限のキャスト追加で解消。typecheck クリーン。
- 2026-04-23 — Phase 1 完了。`docs` ブランチで 5 commit、合計 48 ドキュメントページ (en/ja) 。`git switch -c llm` で Phase 2 用ブランチを派生。
- 2026-04-23 — Phase 2-A 完了。context7.json を作成。folders=docs/en/examples/src/llm-docs、chartjs2img 固有の落とし穴 9 本を rules に。
- 2026-04-23 — Phase 2-B 完了。scripts/build-llms-txt.ts を gridgram からポート、`getLlmDocs()` を直接 import する形に簡素化。package.json に build-llms-txt と ai:regen を追加。llms.txt (3077 chars) と llms-full.txt (165014 chars, 31 docs) を生成確認。
- 2026-04-23 — Phase 2-C 完了。plugins/chartjs2img/ 一式 (plugin.json + 4 SKILL.md + README.md + PUBLISH.md)。Agent Skills 標準 frontmatter のみ。
- 2026-04-23 — Phase 2-D 完了。scripts/validate-plugin-skills.ts を gridgram ベースにポート、plugin.json version 一致チェックとキーワードアサーションを追加。0 error / 0 warning。
- 2026-04-23 — Phase 2-E 完了。.claude/rules/{ai-artifacts-policy,regen-triggers}.md と .claude/skills/regen-ai/SKILL.md。.gitignore で .claude/settings.local.json と scheduled_tasks.lock を除外。
- 2026-04-23 — Phase 2-F 完了。AI Guide 12 ページ (en/ja × 6: index / claude-plugin / gh-skill / context7 / llms-txt / cli)。llms-full.txt の concat 数が 26 → 31 に。
- 2026-04-23 — Phase 2-G 完了。.github/workflows/docs.yml を新設 (typecheck + validate-plugin-skills + build-llms-txt + docs:build)。package.json のスクリプト構成を確認。既存 test.yml には手を加えていない。
- 2026-04-23 — Phase 2-H 完了。最終検証スイート全パス:
  - `bun run typecheck` — clean
  - `bun run validate-plugin-skills` — 0 error / 0 warning, 4 skills checked
  - `bun run build-llms-txt` — 31 docs concatenated
  - `bun run docs:build` — 1.90s, 0 error
  - `chartjs2img llm` — 1442 lines, expected usage disclaimer header
  - LLM.md §8 横展開チェックリスト全項目に対応 (1. CLI → 2. 索引不要 → 3. llms.txt → 4. context7 → 5. .claude/ → 6. plugins/ → 7. marketplace は別リポの GitHub 操作待ち)。ミッション完了。

## 8. LLM.md §8 横展開チェックリスト対応表

- ✅ 1. `gg llm` 相当 = 既存の `chartjs2img llm` と `src/llm-docs/` を SSOT として活用
- ⚠️ 2. アイコン索引は chartjs2img に存在しない (代わりに同梱プラグイン 12 本の LLM docs)
- ✅ 3. `docs/public/llms.txt` + `llms-full.txt` 生成、docs:build に組み込み
- ✅ 4. `context7.json` 作成 (登録自体は https://context7.com/add-package でユーザー操作)
- ✅ 5. `.claude/rules/` + `.claude/skills/regen-ai/` 設置
- ✅ 6. `plugins/chartjs2img/` 同梱 (4 スキル + README + PUBLISH)、validator 0 error
- ⚠️ 7. `ideamans/claude-public-plugins` は GitHub 上の新規リポジトリ作成が必要 (ユーザー操作、本セッションでは触れず)

## 9. 次のアクション (ユーザー側)

1. `git switch docs` して `git merge llm` で両ブランチを統合するか、`llm` から直接 main に PR を出す。
2. `https://context7.com/add-package` で chartjs2img を登録 (約数時間でクロール完了)。
3. `ideamans/claude-public-plugins` リポジトリを作成し、`.claude-plugin/marketplace.json` に chartjs2img エントリを追加 (gridgram 既存エントリと同じ shape、`path: "plugins/chartjs2img"`)。
4. 初回 docs 公開時に `chartjs2img.ideamans.com` の DNS / 配信先を決定し、`scripts/build-llms-txt.ts` の SITE_BASE を必要なら環境変数で上書き。
