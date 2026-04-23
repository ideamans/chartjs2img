---
title: ギャラリー
description: chartjs2img で描画された Chart.js チャートをカテゴリ別に掲載。各例は PNG・JSON・CLI / HTTP コマンドをタブで切り替え可能。
---

# ギャラリー

サンプルチャートはすべて chartjs2img 自身でレンダリング済み。下に
出ている画像は `src/examples.ts` から `bun run docs:examples` で
再生成したもので、本番サービスの出力とビット単位で同じです。

各例は PNG 画像・Chart.js 設定 JSON・貼り付けて使える CLI / HTTP
コマンドをタブで切り替えられます。コピーして改造し、`/render` に
POST してください。

## カテゴリ

| カテゴリ                                    | チャート                                                                |
| ------------------------------------------- | ----------------------------------------------------------------------- |
| [基本チャートタイプ](./basic)               | bar, line, pie, doughnut, radar, polarArea, scatter, bubble, 横棒        |
| [複合チャート](./composite)                 | 塗りつぶしエリア、積み上げ、bar + line ミックス                          |
| [軸とチャートオプション](./axes-options)    | デュアル軸、対数スケール、マイナス値、ラベル回転、グリッド・目盛りのカスタムスタイル |
| [ラベルと注釈](./decorations)               | データラベル、注釈 (line / box / point)、グラデーション塗り、ズームフレーミング、時間軸 |
| [拡張プラグイン](./exotic)                  | treemap、matrix / ヒートマップ、sankey、wordcloud、venn / euler、力学モデルグラフ、整列ツリー、コロプレス雛形 |
| [サイズ](./sizing)                          | 小 400×300 と 横長 1200×400                                              |
| [国際化](./i18n)                            | Noto Sans CJK による日本語ラベル                                         |

## 生成方法

```bash
# 1 コマンドで docs/public/examples/ に全件出力
bun run docs:examples

# 同じ内容がライブギャラリーでも表示される
bun run dev     # その後 http://localhost:3000/examples
```

稼働中サーバーの `/examples` エンドポイントは同じソースから同じ画像を
生成します。自分のサイトに埋め込む場合は、ドキュメントサイトをスクレイプ
するより HTTP API (`GET /render?chart=...`) またはキャッシュ URL パターン
(`/cache/:hash`) の方が通常簡単です。

## 自分のサンプルを追加する

完全レシピは [開発者ガイド → Chart.js プラグインの追加](/ja/developer/adding-plugin)
を参照。要点は `src/examples.ts` の `EXAMPLES` にエントリを追加し、
`bun run docs:examples` を実行するだけ。新チャートは CLI 出力ディレクトリと
ギャラリーの両方に自動で反映されます。
