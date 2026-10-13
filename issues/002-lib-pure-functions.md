---
created_at: 2026-10-13
status: done
---

# 002 lib の純粋関数（入力検証・表示名・JST 変換）

元計画：[IMPLEMENTATION_PLAN.md W2](../docs/IMPLEMENTATION_PLAN.md#w2-lib-の純粋関数s2)

## Background

境界値の多い処理を純粋関数として先に固め、HTTP テスト（S1）では代表ケースだけを扱えるようにする（TEST_STRATEGY §2）。

## Dependencies

- 001 のテスト実行環境（Vitest 設定）。001 と並行して着手し、マージ順で調整してよい。

## Scope

- `src/lib/validation.ts`：trim 後の文字数で必須・上限を判定
- `src/lib/display-name.ts`：メールアドレスの `@` より前を返す
- `src/lib/time.ts`：UTC ISO 8601 → JST `YYYY-MM-DD HH:mm`

## Out of scope

- これらの関数を画面・サービスから使う配線（005 以降）
- コミュニティ名の一意性チェック（DB 制約。005）

## Implementation notes

- 上限：コミュニティ名 50（必須）、説明 500（任意）、スレッドタイトル 200（必須）、投稿本文 10,000（必須）。REQUIREMENTS §6.2。
- 期待値は仕様から固定値で書く（実装と同じ計算で作らない）。

## Acceptance criteria

- [x] REQUIREMENTS §6.2 の必須・上限の判定が関数で行える
- [x] 表示名・JST 変換が仕様どおり
- [x] 共通 DoD（`npm test`・`npm run typecheck` 成功）

## Tests（S2：`test/lib/`）

- validation：空、空白のみ、上限ちょうど、上限＋1、前後空白を含めると上限超だが trim 後は上限内（各項目）。説明は空でも可
- display-name：`alice@example.com` → `alice`
- time：`2026-01-01T00:00:00.000Z` → `2026-01-01 09:00`、`2026-01-01T15:00:00.000Z` → `2026-01-02 00:00`（日付またぎ）
