---
title: サイズ
description: 既定 (800×600) 以外のキャンバスサイズの例 - 小型 400×300 のサムネイルと横長 1200×400 のバナー。
---

# サイズ

既定は 800×600 ピクセル。HTTP/CLI の `width` と `height` オプションで
上書きできます。デバイスピクセル比 (`devicePixelRatio`) は別軸で、
Retina 向けに画像を拡大しますがチャートの内容領域には影響しません。

## 小型 (400×300)

![small 400x300](/examples/16-small-size-400x300.png)

インラインサムネイルやメールヘッダーで典型的なサイズ。

```json
{
  "type": "pie",
  "data": {
    "labels": ["A","B","C"],
    "datasets": [{ "data": [1,2,3] }]
  }
}
```

レンダリングコマンド:

```bash
curl -X POST http://localhost:3000/render \
  -H 'Content-Type: application/json' \
  -d '{"chart":<上記 JSON>,"width":400,"height":300}' \
  -o small.png
```

## 横長 (1200×400)

![wide 1200x400](/examples/17-wide-chart-1200x400.png)

バナー / スパークライン的な用途。

```json
{
  "type": "line",
  "data": {
    "labels": ["1","2","3","4","5","6","7","8","9","10","11","12"],
    "datasets": [
      { "label": "Trend", "data": [5,10,8,15,12,20,18,25,22,30,28,35], "borderColor": "rgb(75,192,192)", "tension": 0.3 }
    ]
  }
}
```

## 注意点

- **chartjs2img では `options.responsive: true` にしてもキャンバスはリフローしません。** コンテナを埋めるために内部でセットしていますが、コンテナ自体のサイズはリクエスト時の `width` / `height` で決まります。
- **アスペクト比は暗黙的です。** `maintainAspectRatio: false` をテンプレートで設定しているので、指定した `width` × `height` がそのまま出ます。
- **デバイスピクセル比は出力ピクセル数を倍にするだけでチャートの詳細度は上げません。** 800×600 で `devicePixelRatio: 2` にすると 1600×1200 の PNG を生成します — チャートは 800×600 の CSS ピクセルで描画され、キャンバスが 2 倍解像度で書き出されます。Retina 表示では良いですが、小ファイルが欲しければ下げてください。
- **スクリーンショット対象は `#chart-container`** であり、ページ全体ではありません。HTML chrome、マージン、チャート内に書かなかった余白は含まれません。
