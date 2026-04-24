---
layout: page
title: chartjs2img
landing:
  hero:
    name: chartjs2img
    text: どこでも Chart.js を画像に。
    primary:
      text: クイックスタート
      link: /ja/guide/
    ai:
      text: AI エージェントで使う
      link: /ja/ai/
    secondary:
      text: GitHub
      link: https://github.com/ideamans/chartjs2img

  concept:
    title: 同じ JSON から、2 つの出力先へ
    intro: Chart.js は同じ設定 JSON をブラウザで読み込んで対話的なチャートを描画します。chartjs2img はその同じ JSON を受け取り PNG を返すので、受信側にブラウザがなくても Slack・メール・PDF レポートに添付できます。
    image: /diagrams/landing-two-flows.svg
    alt: 図 — Chart.js JSON から 2 つのフローが分岐。上段は Chart.js がブラウザで直接レンダリングして対話チャートに。下段は chartjs2img が PNG を生成し、Slack やメールに添付される。

  features:
    items:
      - title: Chart.js + 12 プラグイン同梱
        body: コア + datalabels / annotation / zoom / gradient / treemap / matrix / sankey / wordcloud / geo / graph / venn / date-fns アダプタ。追加インストール不要。
      - title: HTTP API + CLI
        body: JSON を POST すれば画像が返ります。または JSON を CLI にパイプしてファイル出力。同じエンジン・同じキャッシュ・同じプラグイン。
      - title: ハッシュベースキャッシュ
        body: 同一リクエストは即座にキャッシュヒット。SHA-256 ハッシュをヘッダで返すので CDN フレンドリーな URL を組み立てられます。
      - title: LLM ネイティブ
        body: "`chartjs2img llm` が Chart.js + 全プラグインの完全リファレンスを Markdown で出力。エージェントに投げれば初手で正しい config を書かせられます。"

  example:
    title: JSON を投げれば、画像が返る
    intro: Chart.js 設定を JSON で送ると、chartjs2img はレンダリング済み PNG を返します。右の設定に対する実際の出力が左側です。
    name: bar-chart
    previewLabel: レンダリング PNG (800 × 600)
    sourceLabel: Chart.js 設定 (JSON)

  showcase:
    eyebrow: Showcase
    title: 複雑なチャートもまとめて描画
    intro: 複数プラグインの組み合わせ — 時間軸・注釈・データラベル・積み上げ・デュアル軸 — すべて 1 回の JSON リクエストで描けます。
    items:
      - name: showcase-revenue-with-forecast
        title: 売上と予測バンド
        body: 時系列の折れ線にグラデーションを被せ、予測ウィンドウ（annotation）・目標閾値・ピーク点マーカー・各点の値ラベルを重ねた構成。
      - name: showcase-ops-dashboard
        title: 運用ダッシュボード
        body: 積み上げ棒のチケット残量に、右軸の SLA 違反率の折れ線を重ねた運用スナップショット。閾値ラインとピーク負荷帯の注釈つき。

  aiReady:
    eyebrow: AI-native
    title: LLM エージェント駆動を前提に設計
    intro: 4 つの一級エージェント統合チャネル — 既に使っているホストを選べます。どの経路も同じ Chart.js JSON を扱うので、エージェント間で設定が可搬。
    items:
      - title: Claude Code プラグイン
        body: /chartjs2img-install, /chartjs2img-author, /chartjs2img-render のスラッシュコマンドを追加するマーケットプレースプラグイン。
        link: /ja/ai/claude-plugin
        linkText: チュートリアル →
      - title: gh skill
        body: 同じスキルバンドルを Copilot / Cursor / Gemini CLI / Codex に 1 コマンドで導入。
        link: /ja/ai/gh-skill
        linkText: チュートリアル →
      - title: context7 (MCP)
        body: ゼロインストール・ドキュメント取得。MCP 対応エージェントなら chartjs2img のリファレンスを問い合わせ可能。
        link: /ja/ai/context7
        linkText: チュートリアル →
      - title: llms.txt
        body: サイトルートに配置されたパブリック発見ファイル。curl で引けるインデックスと約 165 KB のフルバンドル。
        link: /ja/ai/llms-txt
        linkText: リファレンス →

  finalCta:
    title: さっそくレンダリングを
    text: サインアップ不要・API キー不要 — 全てローカルで動きます。
    primary:
      text: ガイドを読む
      link: /ja/guide/
    ai:
      text: AI エージェントで使う
      link: /ja/ai/
    secondary:
      text: GitHub
      link: https://github.com/ideamans/chartjs2img

  acknowledgments:
    title: オープンソースの肩の上に
    intro: chartjs2img は以下のプロジェクトの上に立っています。ライセンスと告知は Docker イメージとソースツリーに同梱しています。
---

<Landing />
