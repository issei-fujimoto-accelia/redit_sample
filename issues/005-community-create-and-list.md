---
created_at: 2026-10-13
status: done
---

# 005 コミュニティの作成と一覧

元計画：[IMPLEMENTATION_PLAN.md W5](../docs/IMPLEMENTATION_PLAN.md#w5-コミュニティの作成と一覧)

## Background

コミュニティは掲示板の入口であり、スレッドと投稿の親になる。最初の業務スライスとして、作成・一覧・個別ページを通す。

## Dependencies

- 002、004b

## Scope

- `GET /c`：コミュニティ一覧（名前順、ページングなし）と作成フォーム
- `POST /c`：作成（303 → `/c/:id`）
- `GET /c/:id`：名前・説明・作成者と、空のスレッド一覧
- 対応する routes / services / repositories / views

## Out of scope

- 修正・削除（006）
- スレッド一覧とスレッド作成（007、008）

## Implementation notes

- 名前の一意性は `UNIQUE COLLATE NOCASE` と trim 後の値で担保する。重複は 409 で入力値付きの再描画。
- 入力エラーは 400 で入力値とエラーメッセージ付きの再描画。
- ARCHITECTURE §4.2、§5、§5.1。REQUIREMENTS FR-CM-1、FR-CM-2、FR-C-7、§6.2。
- 画面は 004b の共通部品（`CommunityCard`、`PageHeader`、`Field` など）で組み、UI_GUIDELINES §9 のセルフチェックを通す。

## Acceptance criteria

- [x] 名前と説明を入力して作成でき、そのコミュニティページへ移動する
- [x] 既存と同じ名前では作成できず、理由が表示される
- [x] 名前が空・51文字以上、説明が501文字以上では保存されない
- [x] 一覧が名前順に並ぶ
- [x] 存在しないコミュニティで見つからない旨が表示される
- [x] 共通 DoD

## Tests（S1：`test/http/communities.test.ts`）

- 作成 → 303 `Location: /c/:id`、ページに名前・説明・作成者の表示名が出る
- 一覧が名前順（作成順と異なる順序で作り、期待順を固定値で書く）
- 名前が空 → 400、入力値とエラー表示
- 名前 51文字 → 400（代表ケース）
- 同名・大小文字違い・前後空白付きの同名 → 409
- 存在しない `/c/:id` → 404

## 実装メモ

- 層：`routes/communities.tsx` → `services/communities.ts` → `repositories/communities.ts`、画面は `views/pages/communities.tsx`。
- 重複は D1 の `UNIQUE COLLATE NOCASE` 違反を捕まえて 409 にする（trim 後の値で INSERT）。
- 400／409 は `ServiceResult` の `FormFailure`（入力値と項目ごとのエラー）で返し、元の画面を再描画する。
- テストヘルパーに `createCommunity` / `createThread` / `reply` / `idFrom` / `unique` を追加。
- 欄外の注記（`MarginNote`）を共通部品に追加し、コミュニティページの作成者・作成日時を置いた。
- セルフチェック：`design/rounds/06/review.md`（合格）。
