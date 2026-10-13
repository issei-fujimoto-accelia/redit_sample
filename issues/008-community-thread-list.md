---
created_at: 2026-10-13
status: done
---

# 008 コミュニティページのスレッド一覧

元計画：[IMPLEMENTATION_PLAN.md W8](../docs/IMPLEMENTATION_PLAN.md#w8-コミュニティページのスレッド一覧)

## Background

「一望」の体験を担う、コミュニティ内のスレッド一覧を実装する。並び順とページングのクエリは、013 のホーム一覧でも同じ形を使う。

## Dependencies

- 007

## Scope

- `GET /c/:id` のスレッド一覧：`last_posted_at DESC, id DESC`、1ページ20件、`?page=N`
- 各行：タイトル（スレッドページへのリンク）、作成者、投稿数、最終投稿日時
- 前後ページへのリンク

## Out of scope

- ホームの横断一覧（013）
- 返信による並び替えの検証（返信は 010 以降。ここでは作成時刻のみで検証）

## Implementation notes

- `page` が数値でない・1未満は1扱い、範囲外は空の一覧（200）。ARCHITECTURE §5。
- 同時刻の並びは `id DESC`（後に作成したものが上）。
- 全体件数に依存するテストは `listing-community.test.ts` に分ける（TEST_STRATEGY §3.1）。
- 一覧は 004b の `ThreadList`・`ThreadListItem`・`Pagination` で組む（コミュニティチップなし）。013 でも同じ部品を使う。

## Acceptance criteria

- [x] そのコミュニティのスレッドだけが表示される
- [x] 各行にタイトル、作成者、投稿数、最終投稿日時が表示される（コミュニティ名は表示しない）
- [x] 最終投稿日時の新しい順、同時刻は後に作成したものが上
- [x] 21件以上で20件ずつのページに分かれる
- [x] 共通 DoD

## Tests（S1：`test/http/listing-community.test.ts`）

- 2つのコミュニティにスレッドを作り、一方のページには自分のスレッドだけが出る
- 各行の表示項目（投稿数は作成直後なので 1）
- 時計で作成時刻を変えた3件が、新しい順に並ぶ（期待順を固定値で書く）
- 同時刻の2件は後に作成したものが上
- 21件作成 → 1ページ目20件、`?page=2` に1件
- `?page=abc` / `?page=0` は1ページ目、`?page=99` は空の一覧で 200

## 実装メモ

- `repositories/threads.listThreads` は `limit + 1` 件読んで次ページの有無を判定する。013 でも `communityId` なしで使う。
- `parsePage`：数字以外・0・負数・小数は1。
- コミュニティページの再描画（400／409）でも同じ `load()` で一覧を読む。
- 一覧の長いタイトルは3行で省略（スレッドページでは全文）。セルフチェック：`design/rounds/09/review.md`（合格）。
