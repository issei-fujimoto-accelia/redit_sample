---
created_at: 2026-10-13
status: created
---

# 014 セキュリティ・表示の仕上げと受け入れ条件の網羅確認

元計画：[IMPLEMENTATION_PLAN.md W14](../docs/IMPLEMENTATION_PLAN.md#w14-セキュリティ表示の仕上げ)

## Background

機能がそろった段階で、XSS・日時表示・スマホ表示を仕上げ、受け入れ条件がすべてテストか手動チェックに対応しているかを確認する。

## Dependencies

- 012、013

## Scope

- XSS：コミュニティ名・説明・タイトル・本文のエスケープ確認
- 日時表示の代表ケース確認
- スマートフォン幅で読み書きできる最低限の CSS
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

- [ ] `<script>` を含む入力がエスケープされた文字列として表示される
- [ ] 日時が JST の `YYYY-MM-DD HH:mm` で表示される
- [ ] REQUIREMENTS §10 の全受け入れ条件に、対応する自動テストまたは手動チェックがある
- [ ] `npm run test:coverage` で `src/` の行カバレッジ 80% 以上
- [ ] 共通 DoD

## Tests（S1：`test/http/security.test.ts`）

- `<script>alert(1)</script>` を含むコミュニティ名・タイトル・本文が、エスケープされた文字列として表示され、`<script>` 要素にならない
- UTC 15:00 に作成した投稿が JST 翌日 00:00 で表示される（代表ケース）
- 対応表の見直しで見つかった不足分
