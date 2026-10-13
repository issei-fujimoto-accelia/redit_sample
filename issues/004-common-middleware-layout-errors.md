---
created_at: 2026-10-13
status: created
---

# 004 共通ミドルウェア・レイアウト・エラーページ

元計画：[IMPLEMENTATION_PLAN.md W4](../docs/IMPLEMENTATION_PLAN.md#w4-共通ミドルウェアレイアウトエラーページ)

## Background

CSRF 対策・例外処理・共通レイアウトは全画面で使う土台になる。各画面の作業に入る前に用意する。

## Dependencies

- 003

## Scope

- `src/middleware/origin.ts`：POST の `Origin` を自ホストと照合（Hono の `csrf`）
- `src/middleware/error.ts`：例外 → 共通エラーページ（403／404／500／503）
- `src/views/Layout`：ホーム・コミュニティ一覧へのナビゲーション、`white-space: pre-wrap` 用の最低限の CSS
- 未定義パスの 404

## Out of scope

- 各画面の 400／409 の再描画（各機能の Issue で扱う）
- スマホ向け CSS の仕上げ（014）

## Implementation notes

- ARCHITECTURE §5.1（エラー応答）、§7.4（CSRF）、§8（D1 上限超過は 503）。
- エラーメッセージに内部情報（SQL、スタック）を出さない。

## Acceptance criteria

- [ ] 他オリジンからの POST が 403
- [ ] 未定義パスで見つからない旨のページが 404 で表示される
- [ ] 共通 DoD

## Tests（S1）

- `security.test.ts`：`Origin` が自ホストでない POST → 403。`Origin` なしの POST → 403
- `errors.test.ts`：未定義のパス → 404 と見つからない旨の表示
