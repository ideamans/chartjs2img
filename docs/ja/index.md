---
layout: home
title: chartjs2img

hero:
  name: chartjs2img
  text: どこでも Chart.js を画像に。
  tagline: Chart.js の設定 JSON を PNG/JPEG/WebP に変換する CLI + HTTP サービス。ヘッドレス Chromium で描画し、ブラウザのない環境 (メール、PDF、スライド、Slack Bot) からも Chart.js を扱えます。AI エージェントが Chart.js 設定を書く用途にも最適化。
  actions:
    - theme: brand
      text: クイックスタート
      link: /ja/guide/
    - theme: alt
      text: AI エージェントで使う
      link: /ja/ai/
    - theme: alt
      text: GitHub
      link: https://github.com/ideamans/chartjs2img

features:
  - title: Chart.js + 12 プラグイン同梱
    details: コア + datalabels / annotation / zoom / gradient / treemap / matrix / sankey / wordcloud / geo / graph / venn / dayjs アダプタ。追加インストール不要。
  - title: HTTP API + CLI
    details: JSON を POST すれば画像が返ります。または JSON を CLI にパイプしてファイル出力。同じエンジン・同じキャッシュ・同じプラグイン。
  - title: ハッシュベースキャッシュ
    details: 同一リクエストは即座にキャッシュヒット。SHA-256 ハッシュをヘッダーで返すので CDN フレンドリーな URL を組み立てられます。
  - title: 同時実行制御 + クラッシュリカバリ
    details: セマフォで同時実行数を制限。ブラウザ自動再起動、孤児タブのリーパ付き。長時間サービスとして安全に運用できます。
  - title: エラーフィードバック
    details: Chart.js のエラー・警告をブラウザコンソールから捕捉し、X-Chart-Messages (HTTP) または stderr (CLI) で返却。チャートが真っ白な理由を推測する必要はありません。
  - title: 日本語表示対応
    details: Docker イメージに Noto Sans CJK 同梱。tofu もフォントフォールバックも不要で、日本語・中国語・韓国語ラベルが美しく出ます。
  - title: 単一バイナリ
    details: bun build --compile で依存なしの実行ファイルに。Chromium は初回起動時に自動ダウンロードされます。
  - title: LLM ネイティブ
    details: "`chartjs2img llm` が Chart.js + 全プラグインの完全リファレンスを Markdown で出力。エージェントに投げれば初手で正しい config を書かせられます。"
---
