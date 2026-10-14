---
created_at: 2026-10-13
status: done
---

# 014 セキュリティ・表示の仕上げと受け入れ条件の網羅確認

元計画：[IMPLEMENTATION_PLAN.md W14](../docs/IMPLEMENTATION_PLAN.md#w14-セキュリティ表示の仕上げ)

## Background

機能がそろった段階で、XSS・日時表示を確認し、全画面を通しでデザインのセルフチェックにかけ、受け入れ条件がすべてテストか手動チェックに対応しているかを確認する。

## Dependencies

- 012、013

## Scope

- XSS：コミュニティ名・説明・タイトル・本文のエスケープ確認
- 日時表示の代表ケース確認
- 全画面・全状態を通しで UI_GUIDELINES §9 のセルフチェック（§9.7）。画面間の一貫性を重点的に確認する
- `TEST_STRATEGY.md` §5 の対応表と既存テストの突き合わせ、不足分のテスト追加
- カバレッジ 80% の達成確認

## Out of scope

- デプロイと手動テスト（015）
- カバレッジの数値を満たすためだけのテスト

## Implementation notes

- 生 HTML の挿入（`dangerouslySetInnerHTML` 等）が使われていないことを確認する。
- 本人確認・Origin・404 は 004〜012 で追加済みのはず。重複して書かない。
- カバレッジが不足する場合は、未検証の振る舞いがないかを先に確認する（TEST_STRATEGY §7）。

## Acceptance criteria

- [x] `<script>` を含む入力がエスケープされた文字列として表示される
- [x] 日時が JST の `YYYY-MM-DD HH:mm` で表示される
- [x] 全画面の通しのセルフチェックで全評価軸が8点以上（`design/rounds/NN/review.md`）、axe の違反0件、予算内
- [x] ユーザーが全画面をレビューし、承認している
- [x] REQUIREMENTS §10 の全受け入れ条件に、対応する自動テストまたは手動チェックがある
- [x] `npm run test:coverage` で `src/` の行カバレッジ 80% 以上
- [x] 共通 DoD

## Tests（S1：`test/http/security.test.ts`）

- `<script>alert(1)</script>` を含むコミュニティ名・タイトル・本文が、エスケープされた文字列として表示され、`<script>` 要素にならない
- UTC 15:00 に作成した投稿が JST 翌日 00:00 で表示される（代表ケース）
- 対応表の見直しで見つかった不足分

## 実装メモ

- XSS：コミュニティ名・説明・タイトル・本文に `<script>alert(1)</script>` と `<b>` を入れ、`/`・`/c`・`/c/:id`・`/t/:id` のいずれでもエスケープされた文字列になることを確認。`dangerouslySetInnerHTML` 等の生 HTML 挿入は使っていない（`grep` で確認）。
- 日時：UTC 15:00 の投稿が JST 翌日 00:00 で表示され、`<time datetime>` は UTC。
- カバレッジ：`src/` の行カバレッジ 95.1%（Istanbul）。未使用だったリポジトリ関数（`hasThreads`、`hasReplies`）を削除した。
- 全画面の通しのセルフチェック：Round 14（独立採点、全軸8点以上）→ 一貫性の指摘を反映して Round 15（自己採点、全軸8点以上）。axe 0 件、CSS 36.4KB／Font 65.7KB。ユーザー承認済み。

### REQUIREMENTS §10 と検証の対応（TEST_STRATEGY §5 の見直し結果）

| 受け入れ条件 | 検証 |
|---|---|
| Access の認証情報なしは拒否 | `auth.test.ts`、`errors.test.ts` |
| 表示名が `@` より前 | `display-name.test.ts`、`communities`／`threads`／`posts`／`listing-*` の表示確認 |
| 他人に修正・削除の操作が出ない | `security.test.ts`（コミュニティ・スレッド・投稿） |
| 他人の修正・削除は拒否され、データが変わらない | `security.test.ts`（同上） |
| コミュニティの作成・移動、同名不可、入力制約、名前順、削除可否と遷移 | `communities.test.ts`、`validation.test.ts` |
| スレッドの作成・移動・本文が先頭、入力制約 | `threads.test.ts`、`validation.test.ts` |
| ホームは横断、コミュニティページは該当のみ | `listing-home.test.ts`、`listing-community.test.ts` |
| 最終投稿日時順、返信で先頭へ、最新返信の削除で戻る、修正で変わらない | `listing-home.test.ts`、`listing-community.test.ts` |
| 21件以上で20件ずつ、各行の表示項目 | `listing-home.test.ts`、`listing-community.test.ts` |
| タイトル修正で「編集済み」、返信の有無による削除可否と遷移 | `threads.test.ts` |
| 返信が末尾、古い順・ネストなし、修正で「編集済み」、返信は削除可・本文は不可 | `posts.test.ts` |
| HTML が文字列として表示、改行保持 | `security.test.ts`（見た目は手動：015） |
| JST の `YYYY-MM-DD HH:mm` | `time.test.ts`、`posts.test.ts` |
| 存在しない URL で見つからない旨 | `errors.test.ts`、`communities.test.ts`、`threads.test.ts`、`posts.test.ts` |
| スマホ幅で閲覧・投稿できる | デザイン確認（390px）＋手動（015） |
