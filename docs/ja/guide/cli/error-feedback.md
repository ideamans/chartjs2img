---
title: エラーフィードバック (CLI)
description: chartjs2img CLI 利用時に Chart.js の警告やエラーが stderr にどう表れるか。真っ白／部分描画の診断方法。
---

# エラーフィードバック (CLI)

Chart.js 設定に typo があると（例: `"type": "pi"` を `"pie"` の
つもりで書く）、出力が真っ白や部分描画になります。コンソールに
アクセスできないと原因が分かりません。CLI はブラウザ DevTools と
同じメッセージをキャプチャして **stderr** に流します。

## 出力形式

各メッセージには重要度プレフィックスと Chart.js の原文が付与されます。

```
[chart ERROR] "pi" is not a registered controller.
[chart WARN]  Some warning message from Chart.js.
```

2 種類のレベルが出ます:

- `ERROR` — Chart.js が throw した、または描画を拒否した。
- `WARN` — Chart.js は描画したが、ミスの可能性があると警告している。

## 実例

```bash
$ echo '{"type":"pi","data":{"labels":["A"],"datasets":[{"data":[1]}]}}' \
  | chartjs2img render -o chart.png

[chart ERROR] "pi" is not a registered controller.
Written to chart.png (hash: 1234abcd5678efgh)
```

注意点: レンダリング自体は完了し（空/部分 PNG を書き出す）、
CLI はそのまま終了コード `0` を返します。Chart.js の警告は CLI の
失敗として扱わないので、パイプラインは typo で失敗しません。
stderr を自分で監視して判断してください。

## 画像をパイプしつつメッセージも拾う

stdout には画像バイナリが、stderr には診断メッセージが流れる
ので、個別にリダイレクトできます。

```bash
chartjs2img render -i chart.json 2> errors.log > chart.png
```

`errors.log` をチェックすればメッセージが、`chart.png` に画像が
得られます。

## 「描画はされたが内容が誤っている」場合

Chart.js 設定が文法的に正しくて描画も完走するものの、内容として
誤っているケースがあります。例: `scatter` チャートに `labels` と
`datasets[0].data: [1,2,3]` を与えるなど（本来は `{x,y}` の配列）。
これらはしばしば throw せず警告を出します。CI ジョブで成功判定を
する前に必ず stderr を確認してください。

## 推奨エージェントワークフロー

LLM エージェントから `chartjs2img render` を駆動する場合:

1. レンダリングを実行し、stderr をキャプチャ。
2. stderr が空でなければメッセージをエージェントに戻し、設定修正を
   依頼。
3. stderr がクリーンになるまでループ。

これが `chartjs2img-render` Agent Skill のしくみです。詳細は
[AI ガイド → Claude Code プラグイン](/ja/ai/claude-plugin) を参照。

## よく出るメッセージ

| メッセージ                                     | 原因                                                                      |
| ---------------------------------------------- | ------------------------------------------------------------------------- |
| `"X" is not a registered controller.`          | `chart.type` の typo、または同梱プラグインにない chart type を指定。       |
| `Cannot read properties of undefined...`       | `datasets` 欠落、データセット形状誤り、数値 `data` にオブジェクト期待、等。 |
| `No dataset matched the index`                 | `labels.length` と `data.length` の不一致。                                |
| `The scale "y" doesn't have a parser`          | 時系列データにタイムアダプタなし。`scales.x.type: "time"` を使う。         |

判断に迷うときは Chart.js の
[エラーリファレンス](https://www.chartjs.org/docs/latest/) を参照
してください。

## Chart.js 以外のエラー

Chromium 周り（ダウンロード、起動、コンテナ権限）のエラーは
`[chart …]` プレフィックスが **付かず**、通常は終了コードも非ゼロ
になります。これは設定ではなく環境の問題です。

```
[renderer] Chrome/Chromium not found. Installing Chrome for Testing...
[renderer] Downloading Chrome 123.0.0.0 for mac-arm64...
```

自動インストールが失敗する場合は
[インストール → Chromium / Chrome 検出](../install#chromium--chrome-検出)
を参照。
