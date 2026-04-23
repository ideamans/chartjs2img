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

  features:
    items:
      - title: Chart.js + 12 プラグイン同梱
        body: コア + datalabels / annotation / zoom / gradient / treemap / matrix / sankey / wordcloud / geo / graph / venn / dayjs アダプタ。追加インストール不要。
      - title: HTTP API + CLI
        body: JSON を POST すれば画像が返ります。または JSON を CLI にパイプしてファイル出力。同じエンジン・同じキャッシュ・同じプラグイン。
      - title: ハッシュベースキャッシュ
        body: 同一リクエストは即座にキャッシュヒット。SHA-256 ハッシュをヘッダで返すので CDN フレンドリーな URL を組み立てられます。
      - title: LLM ネイティブ
        body: "`chartjs2img llm` が Chart.js + 全プラグインの完全リファレンスを Markdown で出力。エージェントに投げれば初手で正しい config を書かせられます。"

  aiReady:
    eyebrow: AI-native
    title: LLM エージェント駆動を前提に設計
    intro: 4 つの一級エージェント統合チャネル — 既に使っているホストを選べます。どの経路も同じ Chart.js JSON を扱うので、エージェント間で設定が可搬。
    items:
      - title: Claude Code プラグイン
        body: /chartjs2img-install, /chartjs2img-llm, /chartjs2img-author, /chartjs2img-render のスラッシュコマンドを追加するマーケットプレースプラグイン。
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
