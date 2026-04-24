---
title: エラーフィードバック (HTTP)
description: Chart.js の警告・エラーが HTTP でどう表れるか — X-Chart-Messages ヘッダ、4xx の入力検証エラー、5xx の Chromium 関連エラー。
---

# エラーフィードバック (HTTP)

HTTP でのチャートレンダリングには 3 種類のシグナルがあります。

1. **画像本体** — エラーでも常に返ります（空・部分画像になる場合も）。
2. **Chart.js コンソールメッセージ** — ヘッドレスブラウザから
   キャプチャして HTTP ヘッダで返します。
3. **サーバーレベルエラー** — 認証、入力検証、Chromium 障害。
   通常の HTTP ステータスコードで表現します。

このページは上記 3 種類すべてを扱います。

## `X-Chart-Messages` — Chart.js コンソール

Chart.js がエラーや警告を出した場合、レスポンスに以下が付与されます。

```
X-Chart-Messages: [{"level":"error","message":"\"pi\" is not a registered controller."}]
```

JSON としてパースして使います。

```bash
curl -s -D- -X POST http://localhost:3000/render \
  -H 'Content-Type: application/json' \
  -d '{"chart":{"type":"pi","data":{"labels":["A"],"datasets":[{"data":[1]}]}}}' \
  -o /dev/null | grep X-Chart-Messages
```

各メッセージ:

| フィールド | 値                  | 意味                       |
| ---------- | ------------------- | -------------------------- |
| `level`    | `"error"`, `"warn"` | 重要度                     |
| `message`  | string              | Chart.js からの原文        |

このヘッダは **メッセージが存在する場合のみ付与** されます。ヘッダ
が付かない = クリーンなレンダリング。描画自体は成功して `200` と
PNG が返ります（警告は失敗ではなく参考情報）。

## HTTP ステータスコード

| コード | 意味                                                                                                |
| ------ | --------------------------------------------------------------------------------------------------- |
| `200`  | レンダリング成功。Chart.js が警告した場合は `X-Chart-Messages` も付与されることがあります。          |
| `400`  | クライアント入力不備: `chart` 欠落、JSON ボディの構文エラー、`?chart=` クエリ不正など。              |
| `401`  | `API_KEY` 必要なのに未提示／誤り。[認証](./auth) 参照。                                              |
| `404`  | 不明なパス、期限切れ／存在しないキャッシュハッシュ。                                                  |
| `405`  | `/render` に対する許可されていないメソッド（例: `PUT`）。                                              |
| `500`  | サーバー内部エラー — Chromium 起動失敗、ディスクフル、CDN ネットワーク障害など。                      |

4xx / 5xx のボディは JSON オブジェクトです。

```json
{ "error": "Missing or invalid required field: chart (must be an object)" }
```

400 と 500 の区別は意図的です。クライアント入力エラーは監視アラート
対象にしません。本番で 5xx が出たら本当のインシデントとして扱う
（ユーザーの typo ではなく）。

## 「描画はされたが内容が誤っている」

Chart.js 設定が文法的に正しくて描画も完了するのに、内容として誤って
いるケースがあります。例: `scatter` チャートに `labels` と
`datasets[0].data: [1,2,3]` を与える（本来は `{x,y}` の配列）。
これは throw せず警告を出すことが多いので、成功判定の前に
`X-Chart-Messages` を必ず確認してください。

## 推奨エージェントワークフロー

LLM エージェントから HTTP 経由で chartjs2img を使う場合:

1. レンダリングを投げる。
2. レスポンスが 4xx/5xx なら `error` 文字列をエージェントに戻し、
   リクエストまたは環境の修正を依頼。
3. 200 なら `X-Chart-Messages` をチェック。空でなければメッセージを
   戻して設定修正を依頼。
4. メッセージが空になるまでループ。

これが `/chartjs2img-render` Agent Skill のしくみです。詳細は
[AI ガイド → Claude Code プラグイン](/ja/ai/claude-plugin)。

## Chart.js でよく出るメッセージ

| メッセージ                                     | 原因                                                                      |
| ---------------------------------------------- | ------------------------------------------------------------------------- |
| `"X" is not a registered controller.`          | `chart.type` の typo、または同梱プラグインにない chart type を指定。       |
| `Cannot read properties of undefined...`       | `datasets` 欠落、データセット形状誤り、数値 `data` にオブジェクト期待、等。 |
| `No dataset matched the index`                 | `labels.length` と `data.length` の不一致。                                |
| `The scale "y" doesn't have a parser`          | 時系列データにタイムアダプタなし。`scales.x.type: "time"` を使う。         |

判断に迷うときは Chart.js の
[エラーリファレンス](https://www.chartjs.org/docs/latest/) を参照
してください。

## Chromium レベルの障害

ブラウザ自体が起動しない（バイナリ欠落、権限不足、共有メモリ不足
のコンテナなど）場合、サーバーは `500` を次のようなメッセージと
ともに返します。

```json
{ "error": "Failed to install Chrome automatically: ..." }
```

原文は stderr にも出ます。これはチャートではなく環境の問題です。
[インストール → Chromium / Chrome 検出](../install#chromium--chrome-検出)
を参照してください。
