# LLM.md — この文書は移設しました

このファイルにあった「AIエージェント対応プレイブック」は、社内標準として
独立リポジトリに昇格しました。

**→ <https://github.com/ideamans/go-llm-cli-kit/blob/main/LLM.md>**

## なぜ移したか

元の文書は gridgram での実装知見をまとめたもので、chartjs2img へ横展開する際に
この位置へ複製されました。その後 Go 製 CLI 群への展開が始まり、
**プロダクトの一ファイルが全社の基準を兼ねている状態**が原則A（SSOT は1か所）に
反するため、標準として独立させています。

移設先では以下が追加・変更されています。

- Go 実装の章（共有モジュール `github.com/ideamans/go-llm-cli-kit` と雛形一式）
- public / private リポジトリの差分（context7 は public のみ、など）
- `llms.txt` は Go CLI 群では**保留**として明記（ドキュメントサイトを持たず
  配信先が未定のため）。chartjs2img と gridgram の `docs/public/llms.txt` は
  従来どおり配信を継続します

## chartjs2img 固有の記録

このリポジトリでの導入経緯・チェックリストの消化状況は `PLAN.md` に残っています。
`PLAN.md` 内の「LLM.md §N」という参照は、上記の移設先の該当節を指します。
