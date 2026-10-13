---
created_at: 2026-10-13
status: done
---

# 010 返信の投稿

元計画：[IMPLEMENTATION_PLAN.md W10](../docs/IMPLEMENTATION_PLAN.md#w10-返信の投稿)

## Background

スレッドに返信できるようにする。返信の作成は派生値（`post_count`・`last_posted_at`）を更新するため、一覧の表示で正しさを確認する（ADR-3）。

## Dependencies

- 008

## Scope

- スレッドページの返信フォーム
- `POST /t/:id/posts`：返信の作成（303 → `/t/:id#post-:postId`）
- 投稿一覧に各投稿のアンカー（`id="post-:id"`）

## Out of scope

- 投稿の修正・返信の削除（011）
- ホーム一覧での並び替え（013）

## Implementation notes

- batch：`posts` を INSERT → `threads` の `post_count + 1`、`last_posted_at = 作成日時`。ARCHITECTURE §4.4。
- 投稿は `created_at, id` の昇順で表示する。

## Acceptance criteria

- [x] 返信すると投稿一覧の末尾に表示される
- [x] 投稿が古い順に並び、ネストされない
- [x] 返信でスレッドの投稿数と最終投稿日時が更新され、コミュニティページの並び順に反映される
- [x] 共通 DoD

## Tests（S1：`test/http/posts.test.ts`、`listing-community.test.ts`）

- 返信 → 303 `Location: /t/:id#post-:postId`、末尾に本文・投稿者の表示名・JST 日時が表示される
- 3件返信 → 本文が先頭、以降は古い順
- 返信後、コミュニティページの投稿数が 2 になる
- 古いスレッドに返信すると、コミュニティページで先頭に移動する
- 本文空・10,001文字 → 400
- 存在しないスレッドへの返信 → 404

## 実装メモ

- `insertReply`：`INSERT ... SELECT ... WHERE EXISTS (スレッド)` と `post_count + 1`・`last_posted_at` の UPDATE を1つの batch で実行。スレッドが同時に消えていれば 404。
- 400 は入力値を保持し、返信欄にフォーカスして再描画する。
- セルフチェック：`design/rounds/11/review.md`（合格）。
