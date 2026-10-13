---
created_at: 2026-10-13
status: done
---

# 007 スレッドの作成とスレッドページ

元計画：[IMPLEMENTATION_PLAN.md W7](../docs/IMPLEMENTATION_PLAN.md#w7-スレッドの作成とスレッドページ)

## Background

スレッドはタイトルと本文（最初の投稿）を同時に作る。`threads` と `posts` を1つの batch で書き込み、派生値（`post_count`・`last_posted_at`）の初期値もここで決まる。

## Dependencies

- 005（006 と並行可）

## Scope

- コミュニティページのスレッド作成フォーム（タイトル＋本文）
- `POST /c/:id/threads`：作成（303 → `/t/:id`）
- `GET /t/:id`：タイトル、所属コミュニティへのリンク、本文（投稿者の表示名・JST 日時・本文）

## Out of scope

- コミュニティページのスレッド一覧（008）
- 返信（010）、スレッドの修正・削除（009）

## Implementation notes

- batch：`threads` を INSERT（`post_count = 1`、`last_posted_at = created_at`）→ `posts` を INSERT（`is_opening = 1`、`thread_id = last_insert_rowid()`）。ARCHITECTURE §4.4。
- 作成時刻は注入した `now` を使う。
- 本文はプレーンテキスト。JSX の自動エスケープに任せ、生 HTML は挿入しない。

## Acceptance criteria

- [x] タイトルと本文を入力してスレッドを作成でき、スレッドページへ移動する
- [x] 本文が先頭の投稿として、投稿者の表示名と JST 日時付きで表示される
- [x] タイトルが空・201文字以上、本文が空・10,001文字以上では保存されない
- [x] 存在しないコミュニティ・スレッドで 404
- [x] 共通 DoD

## Tests（S1：`test/http/threads.test.ts`）

- 作成 → 303 `Location: /t/:id`、タイトルと本文、作成者の表示名、JST 日時（時計で固定した値）が表示される
- タイトル空 → 400、入力値とエラー付きでコミュニティページを再描画
- 本文 10,001文字 → 400（代表ケース）
- 存在しないコミュニティへの作成 POST → 404
- 存在しない `/t/:id` → 404

## 実装メモ

- `insertThreadWithOpening`：`threads` の INSERT（`RETURNING id`）と本文の INSERT（`last_insert_rowid()`）を D1 の batch で実行。
- 400 はコミュニティページを入力値付きで再描画する。
- `design:seed` にスレッド（XSS 文字列、長いタイトル、21件のページング用データを含む）を追加。
- セルフチェック：`design/rounds/08/review.md`（合格）。
