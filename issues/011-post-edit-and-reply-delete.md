---
created_at: 2026-10-13
status: created
---

# 011 投稿の修正と返信の削除

元計画：[IMPLEMENTATION_PLAN.md W11](../docs/IMPLEMENTATION_PLAN.md#w11-投稿の修正と返信の削除)

## Background

投稿（本文・返信）の修正と返信の削除を扱う。返信の削除では派生値を再計算する。本文は単独では削除できない。

## Dependencies

- 010

## Scope

- `POST /p/:id/edit`：本文・返信の修正（303 → `/t/:thread_id#post-:id`）。「編集済み」表示
- `POST /p/:id/delete`：返信の削除（303 → `/t/:thread_id`）
- 各投稿の編集フォーム（`<details>`）と、返信にのみ削除ボタン（`confirm`）。投稿者本人にのみ表示
- 本文（`is_opening = 1`）への削除 POST → 409（IMPLEMENTATION_PLAN §2 の決定）

## Out of scope

- 返信があるスレッドの削除不可（012）

## Implementation notes

- 返信削除の batch：`posts` を DELETE（`is_opening = 0` かつ本人）→ `threads` の `post_count` と `last_posted_at` を残りの投稿から再計算（`COUNT(*)`、`MAX(created_at)`）。減算はしない。ARCHITECTURE §4.4。
- 修正は1文の UPDATE（`WHERE id = ? AND author_email = ?`）。`last_posted_at` は変えない。

## Acceptance criteria

- [ ] 本文・返信を修正すると「編集済み」が表示される
- [ ] 返信を削除でき、投稿数と最終投稿日時が戻る
- [ ] 本文には削除操作が表示されず、直接 POST しても 409 で削除されない
- [ ] 他人の投稿には操作が表示されず、直接 POST しても 403 でデータは変わらない
- [ ] 共通 DoD

## Tests（S1：`posts.test.ts`、`listing-community.test.ts`、`security.test.ts`）

- 本文の修正 → 303、新しい本文と「編集済み」
- 返信の修正 → 303、新しい本文と「編集済み」
- 修正で本文を空 → 400
- 返信の修正後、コミュニティページの最終投稿日時と並び順が変わらない
- 返信の削除 → 303 `/t/:thread_id`、一覧から消え、投稿数が戻る
- 最新の返信を削除すると、最終投稿日時がその前の投稿の日時に戻る
- 本文に削除操作が表示されない。本文の削除 POST → 409、本文が残る
- 他人の投稿：操作が非表示、修正・削除 POST → 403、内容が変わっていない
