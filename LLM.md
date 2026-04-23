GridgramのAIエージェント親和性を高めるために行ったこと

# LLM.md — AIエージェント対応プレイブック

gridgram で「AIエージェントから見つけやすく・使いやすい」状態を作るために
何を作ったか、なぜそうしたか、どう確認したかをまとめたメモ。実装が一巡したので
**他プロジェクトへ横展開する時の手引き** として、実装後の状態に揃え直した。

各トピックは「ねらい → 実装の形 → 準備 → 動作確認」の順で書いている。
gridgram 固有の事情はその都度切り出してあるので、Bun でない / Tabler でない
プロジェクトでも該当箇所だけ読み替えればよい。

---

## 目次

1. [全体像と成果物](#1-全体像と成果物)
2. [設計原則（Single Source & 自動派生）](#2-設計原則single-source--自動派生)
3. [`gg llm` と `gg icons`（CLI から AI に情報を出す）](#3-gg-llm-と-gg-iconscli-から-ai-に情報を出す)
4. [`docs/public/llms.txt` と `llms-full.txt`](#4-docspublicllmstxt-と-llms-fulltxt)
5. [`context7.json`（context7 への登録）](#5-context7jsoncontext7-への登録)
6. [Claude Code marketplace と `gh skill`（Agent Skills 配布）](#6-claude-code-marketplace-と-gh-skillagent-skills-配布)
7. [Claude Code 内の rules / skills（再生成ドリブン）](#7-claude-code-内の-rules--skills再生成ドリブン)
8. [横展開チェックリスト](#8-横展開チェックリスト)
9. [裏取りメモ](#9-裏取りメモ)
10. [参考資料](#10-参考資料)

---

## 1. 全体像と成果物

最終的にできた口は次の 5 系統。**全部同じ「gridgram の使い方知識」を別フォーマットで
配っている**だけ、というのが要点。

```
                       ┌──────────────────────────────────────────────┐
                       │  src/templates/llm-reference.template.md     │
                       │  src/cli/args.ts  /  src/cli/commands/*.ts   │
                       │  src/gg/dsl.ts (BNF コメント)                │
                       │  src/data/icon-tags.json (タグ追補)          │
                       └──────────────────────────────────────────────┘
                                          │ bun run ai:regen
                                          ▼
   ┌─────────────────────────┬───────────────────────────────┬───────────────────┐
   │ src/generated/          │ docs/public/llms.txt          │ src/generated/    │
   │   llm-reference.md      │ docs/public/llms-full.txt     │   icon-index.json │
   └─────────────────────────┴───────────────────────────────┴───────────────────┘
                │                            │                           │
                ▼                            ▼                           ▼
       gg llm (--format md|json)        外部クローラ・LLM            gg icons --search
       gg icons (--format json)         context7 / 各種 hub          各 SKILL.md から参照
       plugins/gridgram/skills の SKILL.md は人手で参照
```

実体ファイルの所在:

| 役割                                | ファイル                                                       | 追跡 |
| ----------------------------------- | -------------------------------------------------------------- | ---- |
| CLI 定義（共通 args + サブコマンド）| `src/cli/args.ts`, `src/cli/commands/{render,icons,llm,license}.ts` | ◯ |
| `.gg` 文法 SSOT（BNF コメント）     | `src/gg/dsl.ts` 冒頭                                            | ◯ |
| LLM リファレンス・テンプレート      | `src/templates/llm-reference.template.md`                       | ◯ |
| アイコンのタグ追補                  | `src/data/icon-tags.json`（他の `src/data/*` は ignore）        | ◯ |
| 生成: アイコン索引                  | `src/generated/icon-index.json`                                 | × |
| 生成: LLM リファレンス（バンドル元）| `src/generated/llm-reference.md`                                | × |
| 生成: 公開 llms.txt                 | `docs/public/llms.txt`, `docs/public/llms-full.txt`             | × |
| context7 設定                       | `context7.json`（プロジェクト直下、手書き）                     | ◯ |
| プラグイン本体                      | `plugins/gridgram/{.claude-plugin/plugin.json, skills/*/SKILL.md}` | ◯ |
| 検証スクリプト                      | `scripts/validate-plugin-skills.ts`                             | ◯ |
| 再生成スキル                        | `.claude/skills/regen-ai/SKILL.md`                              | ◯ |
| パス連動の再生成リマインダー        | `.claude/rules/regen-triggers.md`                               | ◯ |
| 派生物の手編集禁止ポリシー          | `.claude/rules/ai-artifacts-policy.md`                          | ◯ |

`src/generated/` と `docs/public/llms*.txt` を gitignore に置いたのは「CI と
バンドル時に毎回作る」前提だから。コミットしないことで「ローカル編集で SSOT が
ズレた状態がコミットされる」事故を構造的に避けている。

主要 npm スクリプト（`package.json`）:

```bash
bun run sync-tabler         # tabler コピー → icon-index → llm-reference（チェイン）
bun run ai:regen            # icon-index → llm-reference → llms-txt（3 本立て）
bun run validate-plugin-skills
bun run typecheck && bun test
bun run compile             # 単一バイナリ ./gg を吐く
bun run docs:dev            # 内部で build-llms-txt を呼ぶ
```

CI（`.github/workflows/test.yml`）:

```bash
bun install --frozen-lockfile
bun run sync-tabler          # tabler の JSON をコピー
bun run sync-licenses
bun run ai:regen             # 派生物を毎回作り直す（gitignore なので diff 検査は不要）
bun run typecheck
bun test
```

---

## 2. 設計原則（Single Source & 自動派生）

実装してみて効いた原則 4 つ。順序が大事。

### 原則A: ソースコード／テンプレートが唯一のソース（SSOT）

仕様の原本はリポジトリ内のコード・テンプレート・データの**1 か所**だけに置く。
ドキュメントもエージェント向けバンドルも、必ずそこから派生させる。

| 主題                       | 原本                                                 |
| -------------------------- | ---------------------------------------------------- |
| `.gg` 文法                 | `src/gg/dsl.ts` 冒頭の BNF コメント                  |
| CLI フラグ・ヘルプ         | `src/cli/args.ts` と `src/cli/commands/*.ts`         |
| アイコン本体               | `bun run sync-tabler` でコピーした `src/data/tabler-*.json` |
| アイコンの追補タグ         | `src/data/icon-tags.json`                            |
| LLM 向けリファレンスの文章 | `src/templates/llm-reference.template.md` + `examples/**` |
| 人間向けガイド             | `docs/en/**`（必要なら `docs/ja/**`）                |

### 原則B: 派生物は手編集禁止、生成スクリプトを直す

実装中に何度も誘惑されたが、`src/generated/llm-reference.md` を直接いじっても
次の `ai:regen` で消える。テンプレートかコード側を直す。
これを忘れさせないために `.claude/rules/ai-artifacts-policy.md` を常駐ルールとして
置いた（後述）。

### 原則C: 生成器は最小本数で済ませる

**当初は context7 の rules も plugin の SKILL.md も生成しようと計画していたが、
実装してみたら手書きのほうが整理しやすかった**。理由:

- context7 の `rules` 配列は 5〜10 本の落とし穴リスト。テンプレートを介する旨味より、
  人間が「これは罠か？」と判断して直接書くほうが質が上がる。
- 各 SKILL.md は説明文・ワークフロー・落とし穴が混じった「読み物」。生成器を間に挟むと
  かえって表現の自由を失う。

最終的に走らせるのは 3 本だけ:

```
scripts/build-icon-index.ts     # tabler dump + icon-tags.json → icon-index.json
scripts/build-llm-reference.ts  # template + dsl.ts + args.ts → llm-reference.md
scripts/build-llms-txt.ts       # docs/en/** + llm-reference.md → llms.txt / -full.txt
```

これを `bun run ai:regen` で順番に呼ぶ。`sync-tabler` は最初の 2 本も内蔵していて、
fresh checkout のときの 1 コマンド整備を成立させている。

### 原則D: アイコンはセマンティック検索可能（タグで補強）

「全件閲覧 → タグ絞り込み → タグも含めたキーワード検索」の 3 段で AI が必要な
アイコンを見つけられる構造にする。`src/generated/icon-index.json` の各レコードは
`{ name, set, ref, label, category, tags }` を持ち、`gg icons` がそれを使う。

タグの精度を上げるための仕組み:

- tabler メタの `tags` / `category` をベースに取り込む
- 足りない語彙（`cache`, `kubernetes`, `websocket`, `loadbalancer` など）は
  `src/data/icon-tags.json` で**手動オーバーライド**
- `icon-tags.json` だけは `src/data/` 配下で唯一 git 追跡対象

別プロジェクトでも同じ二段構えが効く。「公式メタを取り込んだうえで自前タグで
パッチを当てる」だけで、検索 UX が劇的に変わる。

### 横断的な開発フロー

```
開発者が SSOT（dsl.ts, args.ts, テンプレート, icon-tags.json, examples/）を編集
  └─ .claude/rules/regen-triggers.md（paths スコープ）が Claude に読み込まれる
       └─ Claude が /regen-ai を提案・実行
            └─ src/generated/** が更新される（ローカルのみ、コミットされない）
PR → main / develop
  └─ GitHub Actions: bun run ai:regen → typecheck → test
       └─ 派生物が生成できないとここで落ちる
```

「派生物の手編集を防ぐ」ためにわざわざ `git diff --exit-code` を CI に組まない
という選択もできる（gridgram は派生物を gitignore したのでそもそも diff が出ない）。
派生物を追跡する設計を選ぶ場合は `git diff --exit-code` を入れるべき。

---

## 3. `gg llm` と `gg icons`（CLI から AI に情報を出す）

### 3-1. ねらい

- **`gg llm`**: エージェントが `gg` を使いこなすのに必要な情報（`.gg` 文法・CLI
  オプション・`doc { }` 設定キー・代表例）を 1 枚のテキストで吐く。
  オフライン環境でも `./gg llm | less` だけで完結。
- **`gg icons`**: 組み込みの Tabler アイコン約 6,000 件を、検索／タグ／フォーマット
  指定で取り出す。

両方とも `--format markdown|json` で機械可読出力に切り替えられる。

### 3-2. 仕様（実装後の確定形）

`src/cli/gg.ts` は [citty](https://github.com/unjs/citty) でサブコマンド分割している。

```
gg <file>                      # 既定の render（既存互換）
gg render <file> [opts]        # 明示形
gg icons [opts]                # アイコン検索・一覧
gg llm [--format markdown|json]
gg license                     # 同梱ライセンス
```

`gg icons` の出口（重要なものだけ）:

| 呼び出し                                  | 出力                                           |
| ----------------------------------------- | ---------------------------------------------- |
| `gg icons`                                | 全件、1 行 1 アイコン（`ref` + ラベル）        |
| `gg icons --search <q>`                   | name / label / tags / category 横断 fuzzy 検索 |
| `gg icons --tag <name>`                   | 指定タグを持つもののみ                         |
| `gg icons --tags`                         | 利用可能タグ一覧（頻度順）                     |
| `gg icons --set tabler-filled`            | セット絞り込み                                 |
| `gg icons --search cloud --limit 20`      | 件数制限（AI のコンテキスト節約）              |
| `gg icons --format json [...]`            | 詳細レコード配列                               |

設計の肝は **段階的絞り込み**。AI はまず `gg icons --tags` で語彙を眺めて、関連タグや
語句で `--search` し、結果を `--limit` で削る。

citty のクセで踏んだもの:

- `--no-X` は自動で `X: false` に化けるので `--no-config` のような boolean 否定形は
  rawArgs から拾い直す必要がある。
- 同名フラグの繰り返し（`--alias a=b --alias c=d`）は最後だけ残るので、これも
  rawArgs を見て自前マージ。

### 3-3. 実装ポイント

- **テキストの原本を分離**: `src/templates/llm-reference.template.md` がテンプレート、
  `scripts/build-llm-reference.ts` が `dsl.ts` の BNF コメント・`args.ts` のヘルプ・
  `examples/` の代表例を埋め込んで `src/generated/llm-reference.md` を吐く。
  `gg llm` はこれを `Bun.file()` で読み出す。`bun --compile` でバイナリ化すると
  生成済み Markdown ごと埋め込まれる。
- **icon-index も同じ流儀**: `scripts/build-icon-index.ts` が tabler の JSON dump と
  `icon-tags.json` を結合して `src/generated/icon-index.json` を吐く。`gg icons` は
  これを読むだけ。検索ロジックは `src/cli/icons-index.ts`。

### 3-4. 動作確認

```bash
# 人間向け
bun run gg llm | less
bun run gg icons | head
bun run gg icons --search "load balancer" --limit 5

# 機械向け
bun run gg llm --format json | jq '. | keys'
bun run gg icons --search server --format json | jq '.[0]'

# バイナリ
bun run compile
./gg llm | head
./gg icons | wc -l   # 6092 (5039 outline + 1053 filled)
```

ドッグフード: Claude Code に `./gg llm` を読ませて、新規プロジェクトで `.gg` を 1 本
書かせる → 実際に `./gg` でレンダーできるか。

---

## 4. `docs/public/llms.txt` と `llms-full.txt`

### 4-1. ねらい

`llmstxt.org` 提唱のパブリック標準。サイト直下 `/llms.txt` にリンク集 Markdown を、
`/llms-full.txt` に全文連結を置く。Anthropic / Vercel / Next.js / Cloudflare などが
すでに配信している。**context7 とは別系統の入口** なので両方あって損しない。

### 4-2. 実装

- VitePress の `docs/public/` は静的にルート配信される。生成スクリプト
  `scripts/build-llms-txt.ts` が `docs/en/**` と `src/generated/llm-reference.md` を
  読んで両ファイルを書き出す。
- `docs:dev` / `docs:build` の前段で `bun run build-llms-txt` が走るように
  `package.json` で繋いでいる。
- 両ファイルは gitignore（VitePress build が dist にコピーする）。

### 4-3. 動作確認

```bash
bun run build-llms-txt
head docs/public/llms.txt
wc -l docs/public/llms-full.txt

# 公開後
curl -s https://gridgram.ideamans.com/llms.txt | head
# リンク先 200 検査（lychee など）
```

---

## 5. `context7.json`（context7 への登録）

### 5-1. context7 の役割

Upstash の MCP サービス。リポジトリに `context7.json` を置いて
`https://context7.com/add-package` から登録すると、context7 側で md/mdx/txt/rst を
クロールして llms.txt 風に整形 → MCP 経由で各種エージェントに配信。**自前で
llms.txt を作る必要はない**（作ってもいい）。

### 5-2. 実装した `context7.json`

```json
{
  "$schema": "https://context7.com/schema/context7.json",
  "projectTitle": "gridgram",
  "description": "Grid-based diagram rendering library and CLI...",
  "folders": ["docs/en", "examples", "src/generated"],
  "excludeFolders": ["docs/.vitepress", "docs/public", "docs/ja",
                     "node_modules", "tests", "dist", "src/data"],
  "excludeFiles": ["CHANGELOG.md"],
  "rules": [
    "Use `doc { … }` ... legacy `%%{…}%%` is removed.",
    "Built-in Tabler icons referenced as `tabler/<name>` ...",
    "Diagnostics returned via --diagnostics ... not exceptions ...",
    "Coordinates accept A1 strings, 1-based tuples, and {col,row} ...",
    "Settings resolve: defaults → gridgram.config.* → doc{} → CLI ...",
    "Exit codes: 0 success / 1 parse / 2 integrity / 3 I/O ...",
    "TypeScript API uses Preact, not React; use h() from 'preact'."
  ]
}
```

### 5-3. 設計上の判断

- `folders` に `src/generated` を入れたのは、context7 にも LLM リファレンスの
  Markdown を読ませたいから。`docs/en` だけだとガイドのみになり、CLI 詳細仕様が
  context7 検索でヒットしない。
- `rules` は **コードを読めば自明な事は書かない**。文法上・運用上の落とし穴
  （5〜10 本程度）に絞る。プロジェクト直下の CLAUDE.md と同質の内容。
- `docs/ja` は除外。英語を第一言語に据えた。日本語が要るなら別 context7 エントリ。

### 5-4. 動作確認

登録は外部サービス側なので、初回だけは数十分〜数時間後に context7.com 上で
確認。Claude Code から:

```
mcp__context7__resolve-library-id  → "gridgram"
mcp__context7__query-docs          → "how do I draw a region in gg"
```

---

## 6. Claude Code marketplace と `gh skill`（Agent Skills 配布）

### 6-1. 全体図

ここが当初の計画から一番形を変えた領域。最終的に **2 リポジトリ構成** に落ち着いた。

```
ideamans/gridgram (本リポ)
└── plugins/gridgram/                ← プラグイン本体（SKILL.md と plugin.json）
        ├── .claude-plugin/plugin.json
        └── skills/{gg-render,gg-icons,gg-author,gg-install}/SKILL.md

ideamans/claude-public-plugins (別リポ)
└── .claude-plugin/marketplace.json  ← 上を git-subdir source で参照
```

メリット:

- マーケットプレイスを将来複数製品の集約先に育てられる（`claude-public-plugins`
  に他の社内プラグインを並べる）。
- 本体リポはプラグインを「同梱」するので、`SKILL.md` の更新が `package.json` の
  bump と同じ PR で完結する（`plugin.json.version` は `package.json.version` と
  揃える運用）。
- マーケットプレイス側はマニフェストだけ。`git-subdir` で本体リポの
  `plugins/gridgram` を切り出して取り込むので 2 重管理にならない。

`marketplace.json` の `source` 例:

```json
{
  "name": "gridgram",
  "source": {
    "source": "git-subdir",
    "url": "https://github.com/ideamans/gridgram.git",
    "path": "plugins/gridgram"
  }
}
```

ユーザー側:

```
/plugin marketplace add ideamans/claude-public-plugins
/plugin install gridgram@ideamans-plugins
```

### 6-2. SKILL.md は Agent Skills 標準フィールドのみ

これが今回最大の学び。**配布する SKILL.md には Claude 専用フィールドを
書かない**。`agentskills.io/specification` の薄い frontmatter だけにすると、
Claude / Copilot / Cursor / Gemini CLI / Codex のどれでも読める。

| フィールド      | 必須 | 備考                                                   |
| --------------- | ---- | ------------------------------------------------------ |
| `name`          | Yes  | 1–64 文字、kebab-case、親ディレクトリ名と一致          |
| `description`   | Yes  | 1–1024 文字、「何をする／いつ使う」を両方             |
| `license`       | No   |                                                        |
| `compatibility` | No   | 環境要件（例: `Requires the gg CLI on PATH`）          |
| `metadata`      | No   | Claude 固有挙動はここに `metadata.claude-code.*` で逃がす |
| `allowed-tools` | No   | 実験的だが各社尊重                                     |

`disable-model-invocation` / `argument-hint` / `paths`（auto-trigger）など
Claude Code 拡張は使わなかった。必要になったら `metadata.claude-code.*` に
入れる。

### 6-3. 検証スクリプト

外部の `skills-ref` を使うつもりだったが、リポジトリに依存を増やしたくなくて
**自前で書いた**: `scripts/validate-plugin-skills.ts`。チェック項目:

- frontmatter の必須フィールド（name / description）
- `name` と親ディレクトリ名の一致
- `description` が長すぎないか・短すぎないか
- 既知のディスカバリ・キーワード（`render`, `gridgram`, `diagnostics` 等）が
  含まれるか（`tests/unit/plugin-skills.test.ts` も併用）
- `plugin.json.version === package.json.version`

CI と `validate-plugin-skills` 経由で必ず通過させる。

### 6-4. 実装したスキル 4 本

- `gg-render` — `.gg` を検証してレンダー
- `gg-icons` — タブラーアイコン検索ワークフロー
- `gg-author` — 説明文から `.gg` を起こすコンポーザ
- `gg-install` — `gg` CLI を GitHub Releases から導入／更新

`gg-install` は最初の計画にはなく、配布してから「`gg` が PATH にいない」事故が
読めて追加した。**配布前提の skill には「環境前提を満たすための skill」を 1 本
入れておくと事故率が下がる**。

### 6-5. `gh skill` 兼用

同じ `SKILL.md` を `gh skill install` でも使える:

```bash
gh skill install ideamans/gridgram/plugins/gridgram/skills/gg-render --agent claude-code
gh skill install ideamans/gridgram/plugins/gridgram/skills/gg-icons --agent copilot
gh skill update
```

`gh skill install` は `repository` / `ref` / tree SHA を frontmatter に注入するので、
バージョン bump なしでも `gh skill update` が差分を検出する。SSOT 一本管理と
相性がよい。

### 6-6. 動作確認

```bash
bun run validate-plugin-skills
claude plugin validate plugins/gridgram

# ローカルのマーケットプレイス検査
claude plugin validate ../claude-public-plugins

# 実インストール
/plugin marketplace add ideamans/claude-public-plugins
/plugin install gridgram@ideamans-plugins
/gg-render
```

### 6-7. リリース・チェックリスト

詳細は `plugins/gridgram/PUBLISH.md` 参照。要点:

- `plugin.json.version` を `package.json.version` に揃える（テストで強制）
- `validate-plugin-skills` と `claude plugin validate` 両方通す
- `description` のディスカバリ・キーワードを変える時はテスト側も追従
- マーケットプレイス側は `git pull && status → commit → push` で配信完了

---

## 7. Claude Code 内の rules / skills（再生成ドリブン）

ここはプロジェクトに入った Claude Code セッションを **「派生物のずれを発生させない
共同編集者」** に仕立てるための仕掛け。プロジェクトローカルにコミットする。

```
.claude/
├── rules/
│   ├── ai-artifacts-policy.md    # 常駐ポリシー（派生物の手編集禁止）
│   └── regen-triggers.md         # paths スコープ（SSOT 編集時にだけ読まれる）
└── skills/
    └── regen-ai/
        └── SKILL.md              # /regen-ai：派生物を全部作り直して検証
```

### 7-1. `ai-artifacts-policy.md`（無条件ロード）

「これらは生成物。手編集禁止。原本はここ」を 1 ページにまとめた表。Claude が
セッション開始時に読み込む。**派生物のリスト** と **対応する SSOT** を
同じ表に並べることがコツ。

### 7-2. `regen-triggers.md`（パススコープ）

frontmatter に `paths:` を書くと、**そのパスを編集したセッションでだけ** Claude に
読み込まれる。gridgram では:

```yaml
paths:
  - "src/gg/dsl.ts"
  - "src/cli/args.ts"
  - "src/cli/commands/*.ts"
  - "src/templates/llm-reference.template.md"
  - "src/data/icon-tags.json"
  - "examples/**"
```

メッセージは「触ったら `/regen-ai` を実行する。派生物を直接いじらない」だけ。
常駐ルールにすると認知負荷が上がるので、必要なときだけ出す。

### 7-3. `regen-ai/SKILL.md`（スラッシュコマンド）

中身は ❶ `git status --short` ❷ `bun run ai:regen` ❸ `typecheck && test`
❹ 報告 の 4 ステップ。`allowed-tools` で `Bash(bun run *)` 等に絞ってある。

**当初は `regen-docs` / `regen-all` も用意するつもりだったが、結局 `ai:regen`
1 本に集約した**。理由は (a) 人間向け docs は手書き派が大半で生成器が
要らなかった、(b) 1 本に絞ったほうがリマインダーが「これを実行」と即決できる。

### 7-4. `.claude/` の取り扱い

`.claude/rules/` と `.claude/skills/` は **commit する**。以下は gitignore:

- `.claude/settings.local.json`（個人別）
- `.claude/scheduled_tasks.lock`
- 各種キャッシュ

これによりチームの誰がチェックアウトしても同じ rules/skills が効く。

---

## 8. 横展開チェックリスト

別プロジェクトに同じ仕掛けを持ち込むときの手順。

### 着手順序（依存関係順）

1. **CLI から AI 向け出力を出す（`gg llm` 相当）**
   - 既存 CLI に `llm` サブコマンドを足す
   - LLM リファレンスをテンプレート化（コード／引数／例を `{{slot}}` で挿し込む）
   - 生成スクリプト 1 本を `package.json` の `ai:regen` に登録
2. **アイコン／資産のセマンティック索引（必要なら）**
   - `src/generated/<name>-index.json` 形式で構造化
   - 公式メタを取り込み + 自前タグの上書きファイルを 1 本用意
   - `<cli> icons` のように `--search / --tag / --tags / --limit` の出口を作る
3. **`docs/public/llms.txt` と `llms-full.txt`**
   - 静的サイトのビルド前に生成スクリプトを噛ませる
4. **`context7.json` をリポジトリ直下に**
   - `folders` に英語ドキュメント＋生成済み LLM リファレンスを含める
   - `rules` は 5〜10 本の落とし穴に絞る
   - 登録: `https://context7.com/add-package`
5. **`.claude/rules/` と `.claude/skills/regen-ai/`**
   - `ai-artifacts-policy.md`（常駐）と `regen-triggers.md`（paths スコープ）の 2 枚
   - `regen-ai` は `<pkg-mgr> run ai:regen → typecheck → test` の薄いスキル
6. **`plugins/<name>/` を本体リポ同梱**
   - `.claude-plugin/plugin.json` と `skills/*/SKILL.md`
   - SKILL.md は Agent Skills 標準フィールドのみ
   - `version` は `package.json.version` と揃える（テストで強制）
   - 自前 validator を `scripts/validate-plugin-skills.ts` に
7. **マーケットプレイス用の別リポ**
   - `<org>/claude-public-plugins` のような集約リポ
   - `marketplace.json` から `git-subdir` で本体を引く
   - 本体側の更新が自動で配信される

### 受け入れ基準（フェーズ共通）

- `<pkg-mgr> run typecheck && test` がクリーン
- バイナリ化（または公開ビルド）した状態で `<cli> llm` / `<cli> icons` が動く
- 新規セッションの Claude Code に CLI を渡し、用途のドッグフードができる
  （何かを書かせて、自プロジェクトのルールで動作するか）

### 引っ越し時の落とし穴

- **派生物を git 追跡するか否かは早めに決める**。gridgram は ignore したので
  CI は「再生成して typecheck / test」だけで完結する。追跡するなら
  `git diff --exit-code` を必ず CI に置く。
- **CLI のサブコマンド設計は早めに citty 等に乗る**。素の `process.argv` を
  pickup していると、`--no-foo` の正規化や繰り返しフラグで詰まる（gridgram は
  実際これで rawArgs 直読みパッチを足した）。
- **SKILL.md に Claude 専用フィールドを書かない**。後で他社エージェントへの配信が
  発生した時に書き直しになる。Claude 固有挙動は `metadata.claude-code.*` に。
- **配布する CLI の導入手順を skill にする**。`gg-install` のような「環境を整える」
  スキルが 1 本あると、ユーザー側のサポート負荷が劇的に減る。

---

## 9. 裏取りメモ

実装に着手する前に独立ソースで再確認した事実と、実装後にそれをどう反映したか。
他プロジェクトでも同じ判断基準で検証できるよう残しておく。

### 9-1. llms.txt は方向として正しい

- Anthropic / Vercel / Next.js / Cloudflare が採用済み
  （`https://code.claude.com/docs/llms.txt`, `https://nextjs.org/docs/llms-full.txt`,
  `https://vercel.com/llms.txt` が実配信）。
- `llms-full.txt` は Mintlify が Anthropic と共同で策定した派生で、「サイト全
  Markdown を 1 ファイルに連結した版」。gridgram でも併置した。
- レジストリ: `llms-txt-hub`（`github.com/thedaviddias/llms-txt-hub`）。

### 9-2. context7.json のスキーマは記述どおり

- 公式: `github.com/upstash/context7/blob/master/schema/context7.json`
- 実例: Azure/azure-dev、PagerDuty/terraform-provider-pagerduty、c15t/c15t
- `folders: []` で全スキャン、ルート md は常に含む、は確定仕様
- `rules` の長さ上限は schema には無いが、実務的には 5〜10 本に抑えるのがよい

### 9-3. Agent Skills 標準と Claude Code 拡張を分けて扱う（最重要）

`agentskills.io/specification` のオープン標準 frontmatter はごく薄い:

| フィールド        | 必須 | 備考                          |
| ----------------- | ---- | ----------------------------- |
| `name`            | Yes  | 1–64文字、小文字英数 + ハイフン |
| `description`     | Yes  | 1–1024 文字                   |
| `license`         | No   |                               |
| `compatibility`   | No   | 1–500 文字                    |
| `metadata`        | No   | 任意                          |
| `allowed-tools`   | No   | 実験的                        |

Claude Code 独自の `disable-model-invocation`, `user-invocable`, `argument-hint`,
`arguments`, `paths`, `model`, `effort`, `context`, `agent`, `hooks`, `shell`,
`when_to_use` などは **他エージェントでは無視される**。

実装に反映:

- 配布用 `plugins/gridgram/skills/*/SKILL.md` は **標準フィールドのみ**。
- ローカル用 `.claude/skills/regen-ai/SKILL.md` は Claude 拡張を自由に使う
  （`allowed-tools` の Bash 限定指定など）。
- `.claude/rules/regen-triggers.md` の `paths:` は Claude 拡張だが、これは
  そもそも Claude Code 専用機能なので問題なし。

### 9-4. `gh skill` と provenance metadata

- GitHub CLI v2.90.0 から `install / preview / search / publish / update`。
- `gh skill install` 時に `repository` / `ref` / tree SHA が SKILL.md frontmatter に
  注入される（provenance）。ツリー SHA で差分検出するのでバージョン bump 不要。
- `gh skill publish` は immutable release（公開後改変不可）オプションあり。

これは「SSOT に原本を置いて派生物を機械生成」する gridgram の方針と相性がよい。

### 9-5. Claude マーケットプレイスの参考実装

- Anthropic 公式: `github.com/anthropics/skills`
  （`.claude-plugin/marketplace.json` + `plugins/<name>/skills/<skill>/SKILL.md`）
- コミュニティ: `daymade/claude-code-skills`,
  `alirezarezvani/claude-skills`（後者は 230+ skill を Claude/Codex/Gemini/Cursor
  横断で配布）
- gridgram の 2 リポ構成（本体同梱 + マーケットプレイス別リポを `git-subdir` で参照）は
  Anthropic 公式の単一リポ集約とは違うが、本体と密結合な skill を持つ製品では
  この形のほうが配布のテンポが速い。

### 9-6. 着手前と実装後で変わったこと

| 当初計画                                       | 実装後                                                     |
| ---------------------------------------------- | ---------------------------------------------------------- |
| `gg --llm` フラグ                              | `gg llm` サブコマンド（`citty` ベース）                    |
| `gg --icons` フラグ                            | `gg icons` サブコマンド                                    |
| `regen-ai / regen-docs / regen-all` の 3 種類  | `regen-ai` 1 本に集約                                      |
| 5 本の生成スクリプト                           | 3 本（icon-index / llm-reference / llms-txt）              |
| context7.json の rules を生成                  | 手書き（5〜10 本の落とし穴に絞れば生成器より整理しやすい） |
| `plugins/gridgram/` を別リポ                   | 本体同梱 + マーケットプレイス別リポから `git-subdir` 参照  |
| skills 1〜2 本                                 | 4 本（`gg-install` を運用後に追加）                        |
| 外部 `skills-ref` で検証                       | 自前 `scripts/validate-plugin-skills.ts`                   |
| `git diff --exit-code` を CI に追加            | 派生物を gitignore したので不要                            |

---

## 10. 参考資料

### 標準・仕様

- llms.txt 仕様: <https://llmstxt.org/>
- llms-txt-hub（実装サイトのレジストリ）: <https://github.com/thedaviddias/llms-txt-hub>
- Mintlify の llms-full.txt 解説: <https://www.mintlify.com/blog/what-is-llms-txt>
- Vercel の llms.txt 実装: <https://vercel.com/llms.txt>
- Next.js llms-full.txt: <https://nextjs.org/docs/llms-full.txt>
- Agent Skills オープン標準: <https://agentskills.io/specification>
- Agent Skills 公式バリデータ: <https://github.com/agentskills/agentskills/tree/main/skills-ref>

### Claude Code / context7 / gh skill

- Anthropic 公式 skills（marketplace.json 実例）: <https://github.com/anthropics/skills>
- Claude Code skills ドキュメント: <https://code.claude.com/docs/en/skills>
- Claude Code plugin marketplace: <https://code.claude.com/docs/ja/plugin-marketplaces>
- `gh skill` 発表: <https://github.blog/changelog/2026-04-16-manage-agent-skills-with-github-cli/>
- `gh skill install` リファレンス: <https://cli.github.com/manual/gh_skill_install>
- context7 追加手順: <https://context7.com/docs/adding-libraries>
- context7 スキーマ: <https://github.com/upstash/context7/blob/master/schema/context7.json>
- context7.json 実例（Azure）: <https://github.com/Azure/azure-dev/blob/main/context7.json>

### gridgram 内の一次ソース（横展開時の参照雛形）

- `src/cli/args.ts` / `src/cli/commands/*.ts` — citty サブコマンド構成
- `src/cli/icons-index.ts` — アイコン検索ロジック
- `src/templates/llm-reference.template.md` — LLM リファレンスのテンプレート
- `scripts/build-icon-index.ts` / `build-llm-reference.ts` / `build-llms-txt.ts`
- `scripts/validate-plugin-skills.ts` — SKILL.md 自前検証
- `.claude/rules/{ai-artifacts-policy,regen-triggers}.md`
- `.claude/skills/regen-ai/SKILL.md`
- `plugins/gridgram/.claude-plugin/plugin.json`
- `plugins/gridgram/skills/{gg-render,gg-icons,gg-author,gg-install}/SKILL.md`
- `plugins/gridgram/PUBLISH.md` — 配信前チェックリスト
- `context7.json`
- `tests/unit/plugin-skills.test.ts` — SKILL.md のディスカバリ・キーワード検証
