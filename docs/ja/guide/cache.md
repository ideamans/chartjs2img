---
title: キャッシュ
description: chartjs2img のハッシュベースキャッシュの仕組み、X-Cache-* ヘッダーの読み方、ハッシュから CDN フレンドリーな URL を組み立てる方法。
---

# キャッシュ

`POST /render` はリクエストの正規化済み内容 (チャート設定 + サイズ +
フォーマット + オプション) の SHA-256 ハッシュを計算します。同じ
ハッシュが最近レンダリングされていれば、キャッシュ済み画像を
即座に返します。

## ハッシュの計算ルール

キャッシュキーは次の要素から決定論的に生成されます:

- `chart` (全 JSON、キー順を正規化)
- `width`, `height`, `devicePixelRatio`
- `backgroundColor`, `format`, `quality`

キー順を入れ替えても、ホワイトスペースを変えても、浮動小数表現が
僅かに違っても、ハッシュは一致します (ハッシュ前に正規化するため)。
しかしデータ値を 1 つでも変えれば、新しいハッシュになります。

ハッシュは SHA-256 ダイジェストの先頭 16 桁 (16 進)。キャッシュ層として
衝突確率は十分に低い。

## 見るべきヘッダー

`/render` のレスポンスには常に次が含まれます:

| ヘッダー         | 例                                              | 意味                                  |
| ---------------- | ----------------------------------------------- | ------------------------------------- |
| `X-Cache-Hash`   | `6b4cc4e8940fd921`                              | この画像のキー                         |
| `X-Cache-Url`    | `http://host:3000/cache/6b4cc4e8940fd921`       | 直接再取得できる URL                  |
| `X-Cache-Hit`    | `true` / `false`                                | キャッシュから配信されたか             |

## CDN フレンドリーな URL

`X-Cache-Url` は `/cache/:hash` を指す GET エンドポイントなので、
その URL をブラウザ、Markdown、CDN にそのまま渡せます。一度取得すれば、
大抵の CDN は永続的にキャッシュ可能 (ハッシュごとに不変なため)。

```html
<!-- 一度レンダリングしたら永続的に再利用 -->
<img src="https://charts.example.com/cache/6b4cc4e8940fd921">
```

## 追い出しと TTL

| 設定               | 既定値 | 環境変数              |
| ------------------ | ------ | --------------------- |
| メモリ内エントリ上限 | 1000   | `CACHE_MAX_ENTRIES`   |
| 生存時間 (秒)      | 3600   | `CACHE_TTL_SECONDS`   |

キャッシュは LRU + TTL 方式。いずれかの上限に達すると、古いエントリから
追い出されます。追い出された `/cache/:hash` を取りに行くと `404` が返ります。

## キャッシュが効くケース

- **ダッシュボード** — 多数の閲覧者に同じチャートを何度も表示する用途。
- **LLM エージェント** — 反復試行中に同じ設定を何度も提案する場合。
- **スナップショットメール / レポート** — 発行時に一度計算して各所に
  埋め込むケース。

## キャッシュが効かないケース

- 毎リクエスト入力が変わるライブデータストリーム — ハッシュは常にミス。
- 各リクエストで物理的に再レンダリングが必要なコンプライアンス要件
  (最新データで描いた証跡が必要) — その場合は `CACHE_MAX_ENTRIES=0` に。

## スモークテスト

```bash
# 1 回目 — 新規レンダー
curl -s -D- -X POST http://localhost:3000/render \
  -H 'Content-Type: application/json' \
  -d '{"chart":{"type":"bar","data":{"labels":["A","B"],"datasets":[{"data":[1,2]}]}}}' \
  -o /dev/null | grep -i x-cache

# 2 回目 — 同じボディ、ヒットになるはず
curl -s -D- -X POST http://localhost:3000/render \
  -H 'Content-Type: application/json' \
  -d '{"chart":{"type":"bar","data":{"labels":["A","B"],"datasets":[{"data":[1,2]}]}}}' \
  -o /dev/null | grep -i x-cache
```

`X-Cache-Hit: false` に続いて `X-Cache-Hit: true` が出れば OK。
