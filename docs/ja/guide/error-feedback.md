---
title: エラーフィードバック
description: Chart.js のエラーと警告が chartjs2img からどのように返ってくるか - HTTP は X-Chart-Messages、CLI は stderr、メッセージを受け取ったときの対応。
---

# エラーフィードバック

チャートのレンダリングは 3 種類のシグナルを生みます。

1. **画像そのもの** — 何かしらの問題があっても常に返される。
2. **Chart.js のコンソールメッセージ** — ブラウザから取り込み、構造化データで返却。
3. **サーバーレベルエラー** — 認証、Chromium 不在など。HTTP ステータスコードで通知。

このページは #2 — Chart.js が「何かおかしい」と伝えてくる経路について。

## なぜこれが必要か

Chart.js 設定に typo (例: `"type": "pi"` を `"pie"` の意図で書いた)
があると、空または欠損したチャートが描画されます。コンソールを見ない限り、
なぜ空なのか分からない状態になります。chartjs2img は DevTools で見える
のと同じメッセージを取り込んで返します。

## HTTP — `X-Chart-Messages`

Chart.js がレンダリング中にエラーや警告を出すと、レスポンスに以下が付きます:

```
X-Chart-Messages: [{"level":"error","message":"\"pi\" is not a registered controller."}]
```

JSON としてパースしてください:

```bash
curl -s -D- -X POST http://localhost:3000/render \
  -H 'Content-Type: application/json' \
  -d '{"chart":{"type":"pi","data":{"labels":["A"],"datasets":[{"data":[1]}]}}}' \
  -o /dev/null | grep X-Chart-Messages
```

各メッセージの構造:

| フィールド | 値                   | 説明                    |
| ---------- | -------------------- | ----------------------- |
| `level`    | `"error"`, `"warn"` | 重大度                  |
| `message`  | string               | Chart.js からの原文     |

このヘッダーは **メッセージが 1 件以上発生した時のみ** 付きます。
ヘッダーが無ければクリーンなレンダー。

## CLI — stderr

CLI モードでは、同じメッセージがプレフィックス付きで stderr に出ます:

```bash
$ echo '{"type":"pi","data":{"labels":["A"],"datasets":[{"data":[1]}]}}' \
  | chartjs2img render -o chart.png

[chart ERROR] "pi" is not a registered controller.
Written to chart.png (hash: ...)
```

レンダリング自体は完了し (空/一部欠損の PNG が書き込まれる)、CLI は `0` で
終了します。画像バイナリをパイプする場合は stderr と stdout を分離:

```bash
chartjs2img render -i input.json 2> errors.log > chart.png
```

## 「成功しているが間違っている」ケース

構文的には正しく、レンダリングも通るが、結果が正しくないケースがあります。
例えば `scatter` に `labels` + `datasets[0].data: [1,2,3]` を渡す (本来は
`{x,y}` ペアが必要) など。多くの場合例外はスローされませんが、コンソール
には警告が出ます。成功を宣言する前に必ずメッセージを確認しましょう。

## 推奨エージェントワークフロー

chartjs2img を LLM エージェントから駆動する場合:

1. レンダリングを実行。
2. `X-Chart-Messages` (HTTP) または stderr (CLI) を確認。
3. 配列が空でなければ、メッセージをエージェントに返して設定を修正させる。
4. メッセージが空になるまで繰り返す。

`/chartjs2img-render` Agent Skill はこのフローを自動化します。
詳しくは [AI ガイド → Claude Code プラグイン](/ja/ai/claude-plugin) を参照。

## よくあるメッセージ

| メッセージ                                        | 典型的な原因                                    |
| ------------------------------------------------- | ----------------------------------------------- |
| `"X" is not a registered controller.`             | `chart.type` の typo                            |
| `Cannot read properties of undefined...`          | `datasets` 欠落、または dataset 形状が不正      |
| `No dataset matched the index`                    | `labels.length` と `data.length` の不一致       |
| `The scale "y" doesn't have a parser`             | time-series データに `chartjs-adapter-dayjs-4` の date adapter が欠落 |

迷ったときは Chart.js 公式の [エラーリファレンス](https://www.chartjs.org/docs/latest/)
を参照。
