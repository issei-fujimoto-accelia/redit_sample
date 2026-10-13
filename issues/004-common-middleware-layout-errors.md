---
created_at: 2026-10-13
status: done
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
- `src/views/Layout`：ホーム・コミュニティ一覧へのナビゲーションを持つ HTML の骨格（見た目は 004b で仕上げる）
- 未定義パスの 404

## Out of scope

- 各画面の 400／409 の再描画（各機能の Issue で扱う）
- CSS、デザイントークン、共通部品、エラーページの見た目（004b）

## Implementation notes

- ARCHITECTURE §5.1（エラー応答）、§7.4（CSRF）、§8（D1 上限超過は 503）。
- エラーメッセージに内部情報（SQL、スタック）を出さない。

## Acceptance criteria

- [x] 他オリジンからの POST が 403
- [x] 未定義パスで見つからない旨のページが 404 で表示される
- [x] 共通 DoD

## Tests（S1）

- `security.test.ts`：`Origin` が自ホストでない POST → 403。`Origin` なしの POST → 403
- `errors.test.ts`：未定義のパス → 404 と見つからない旨の表示

## 実装メモ

- Origin 検証は Hono の `csrf` ではなく自前の `origin()` ミドルウェアにした。`csrf` はフォーム系の Content-Type だけを検査し、`Sec-Fetch-Site: same-origin` でも通すため、「更新系はすべて Origin が自ホストと一致すること」を必須にする方が意図（ARCHITECTURE §7.4）に沿う。
- D1 の上限超過は `D1_ERROR` かつ limit/exceeded を含むエラーメッセージで判定して 503、それ以外の例外は 500。
- `render()` で `<!DOCTYPE html>` を付けて返す。
