# CLAUDE.md — chartjs2img

Chart.js の設定 JSON を受け取り、サーバーサイドで画像にレンダリングする。
HTTP API・CLI・TypeScript ライブラリの3形態で配布し、レンダリングエンジンは
`skia`（既定、ブラウザ不要）と `browser`（headless Chromium）の2つを持つ。
CLI のコマンド名は `chartjs2img`。

## 変更時の必須手順

**機能を追加した、オプションを増やした、既存の挙動を変えた — このいずれかをしたら、
3か所すべてを更新してから終わること。** どれか1つでも欠けると、人間か
エージェントのどちらかが古い情報で動くことになる。

| 更新先 | 対象 | やり方 |
| --- | --- | --- |
| ① ドキュメント | `README.md` | 手で更新。使い方が変わったときのみ |
| | `docs/en/**` と `docs/ja/**` | **両方**。片方だけ直すと翻訳がずれる |
| ② ヘルプ | `src/index.ts` の `printUsage()` | CLI のフラグ説明。人間もエージェントもまずここを読む |
| ③ **LLMナレッジ** | `src/llm-docs/<module>.ts` | 手書き。プラグイン1つにつき1ファイル |
| | `src/llm-docs/index.ts` | 章の登録と並び順 |
| | `plugins/chartjs2img/skills/*/SKILL.md` | 手順や前提が変わったとき |
| | `context7.json` の `rules` | 新しい落とし穴が生まれたとき |
| | `docs/public/llms*.txt` | **生成物。手編集しない** → `bun run ai:regen` |

③ を忘れやすい。ドキュメントとヘルプは人間が読んで気づくが、**LLMナレッジが
古いことには誰も気づかない** — エージェントが黙って間違えるだけで、症状は
「なぜかうまく使えない」という形でしか現れない。

判断に迷ったときの目安:

- **Chart.js プラグインを追加・更新した** → `src/template.ts` の `LIBS`、
  対応する `src/llm-docs/<plugin>.ts`、`src/llm-docs/index.ts` への登録。
  バージョン番号は README とドキュメントにも出る
- **CLI のフラグを足した** → `printUsage()` と `docs/en`・`docs/ja` の該当ページ。
  使い方が非自明なら `src/llm-docs/usage.ts` にも
- **既定値・出力形式・エラーの返し方を変えた** → ①②③ すべて。特に
  `usage.ts` と `context7.json` の該当 rule
- **エージェントが間違えやすい罠を見つけた** → `src/llm-docs/` の該当章と
  `context7.json` の `rules`
- **`src/examples.ts` / `src/template.ts` を触った** → `bun run docs:examples` で
  `docs/public/examples/*.png` を作り直す
- **エンジン（skia / browser）の挙動を変えた** → 両エンジンで差が出るなら
  必ず明記する。ここは利用者が最も混乱する

## 確認

CI と同じ順序で回す:

```bash
bun install --frozen-lockfile
bun run ai:regen                 # 生成物を作り直す（llms.txt / llms-full.txt）
bun run validate-plugin-skills   # SKILL.md の frontmatter とバージョン整合
bun run typecheck                # 型
bun test                         # ユニットテスト
```

生成物は `.gitignore` 済みでビルド時に毎回作るため、`git diff` で差分を追う必要はない
（Go 側の CLI とはここだけ方針が逆。詳細は下記「参照」の標準を見ること）。

CI も同じことをする。ローカルで通してから push すること。

## バージョン

`package.json` の `version` が唯一の原本。`src/version.ts` がそれを読み、
`plugins/chartjs2img/.claude-plugin/plugin.json` の `version` は
これと一致していなければならない（`validate-plugin-skills` が検査し、
リリースワークフローがタグとの一致も検査する）。上げるときは同じコミットで両方。

## 参照

- 標準: <https://github.com/ideamans/go-llm-cli-kit/blob/main/LLM.md>
- 生成物と原本の対応: `.claude/rules/ai-artifacts-policy.md`
- 再生成のトリガー: `.claude/rules/regen-triggers.md`
- 再生成: `/regen-ai`
