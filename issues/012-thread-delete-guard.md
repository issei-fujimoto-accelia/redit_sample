---
created_at: 2026-10-13
status: done
---

# 012 スレッド削除の不可条件（返信あり）

元計画：[IMPLEMENTATION_PLAN.md W12](../docs/IMPLEMENTATION_PLAN.md#w12-スレッド削除の不可条件返信あり)

## Background

返信が残っているスレッドは削除できない。返信の作成・削除が揃ったため、ここで検証する。

## Dependencies

- 009、011（013 と並行可）

## Scope

- 返信があるスレッドの削除 → 409、スレッドページを理由付きで再描画

## Out of scope

- 真の並行実行（削除と返信の同時発生）の検証（TEST_STRATEGY §8 で未検証として受け入れ済み）

## Implementation notes

- 009 の batch の DELETE 条件（返信が存在しない）が 0行になったとき、原因を判別して 409 にする。
- 子要素を残したまま親が消えないことを、逐次テストで確認する。

## Acceptance criteria

- [x] 返信があるスレッドは削除できず、理由が表示される。スレッドと投稿が残る
- [x] 返信をすべて削除した後は、スレッドを削除できる
- [x] 共通 DoD

## Tests（S1：`test/http/threads.test.ts`）

- 返信ありのスレッド削除 → 409、理由の表示、その後の GET でスレッドと全投稿が残っている
- 返信を削除 → スレッド削除 → 303 `/c/:community_id`

## 実装メモ

- 削除不可の条件は 009 の batch（本文・スレッドの DELETE とも「返信なし」を条件に含める）で実装済みだったため、本 Issue ではテストを追加して振る舞いを確認した（テストは最初から green）。
- 0行の原因判別（`explainZero`）で、未検出・本人以外でなければ 409 とする。
