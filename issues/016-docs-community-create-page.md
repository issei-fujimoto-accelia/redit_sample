---
created_at: 2026-10-14
status: done
---

# 016 ［ドキュメント］コミュニティ作成を独立ページにする

元計画：デザイン修正（2026-10-14 のユーザー指示）。関連：[REQUIREMENTS.md §5](../docs/REQUIREMENTS.md#5-画面とユーザーフロー)、[ARCHITECTURE.md §5](../docs/ARCHITECTURE.md#5-ルーティング)、[UI_GUIDELINES.md §4](../docs/UI_GUIDELINES.md#4-レイアウト)、[IMPLEMENTATION_PLAN.md](../docs/IMPLEMENTATION_PLAN.md)

## Background

現在、コミュニティ作成フォームはコミュニティ一覧ページの末尾に置いている（005）。
一覧を閲覧するための画面と作成のための画面を分け、一覧には「コミュニティを作る」ボタンだけを置く方針に変える。
画面とルーティングが増えるため、コード（017）の前にドキュメントを更新する。

## Dependencies

なし（017 の前提）

## Scope

- **REQUIREMENTS**
  - §5.1 画面：「コミュニティ作成」画面を追加。コミュニティ一覧の内容から作成フォームを外し、「作成ボタン（作成画面へ移動）」にする
  - §5.2 フロー：コミュニティ一覧 →（作成ボタン）→ コミュニティ作成 →（作成）→ 作成したコミュニティページ
  - FR-CM-2 の表現を必要に応じて調整。§10 受け入れ条件に「一覧の作成ボタンから作成画面へ移動できる」を追加
- **ARCHITECTURE**
  - §5 ルーティング：`GET /c/new`（作成ページ）を追加。`POST /c` の 400／409 は作成ページを入力値付きで再描画
  - 「画面数は Requirements の4画面のまま」の記述を更新
  - `/c/new` と `/c/:id` の衝突（`new` は ID として解釈しない）を明記
- **UI_GUIDELINES**
  - §4.2：コミュニティ一覧（作成ボタンの位置）と、コミュニティ作成ページの構成を追加
  - §9.7 などの対象画面一覧に作成ページを追加
- **TEST_STRATEGY** §5：受け入れ条件の追加分の検証先
- **IMPLEMENTATION_PLAN**：追加作業（W16：コミュニティ作成ページ）を追記し、017 との対応を書く

## Out of scope

- コードの変更（017）
- `spec/CONCEPT.md` の変更。§7 の画面表は「4画面」だが、CLAUDE.md の方針により明示的な指示なしには修正しない。差分は REQUIREMENTS 側で吸収し、CONCEPT の修正要否はユーザーに確認する

## Implementation notes

- 「コミュニティページに、コミュニティを作るボタン」は、コミュニティ**一覧**ページ（`/c`）に置く解釈で進める。個々のコミュニティページ（`/c/:id`）にも置くかは、着手時にユーザーに確認する。
- 作成ページの URL は `/c/new` を推奨（REST の慣例どおり、一覧の配下）。
- ヘッダーなど共通レイアウトは他の画面と同じ（ナビの現在地は「コミュニティ」）。

## Acceptance criteria

- [x] REQUIREMENTS・ARCHITECTURE・UI_GUIDELINES・TEST_STRATEGY・IMPLEMENTATION_PLAN の該当箇所が更新され、互いに矛盾しない
- [x] 作成ページの URL、エラー時の再描画先、遷移が文書で一意に決まっている
- [x] CONCEPT との差分（画面数）の扱いがユーザーと合意されている

## Tests

- ドキュメントのみのため自動テストなし。017 の Tests 欄を本 Issue の決定に合わせて見直す

## 決定事項（ユーザー確認済み）

- 作成ボタンはコミュニティ**一覧**（`/c`）にのみ置く。個々のコミュニティページには置かない。
- 作成ページの URL は `/c/new`。`POST /c` の 400／409 は作成ページで再描画。
- `spec/CONCEPT.md` §7 の画面表も更新する（ユーザーの明示的な指示）。コミュニティ作成画面を追加した。

## 更新した文書

- `spec/CONCEPT.md` §7、`docs/REQUIREMENTS.md` §5.1・§5.2・FR-CM-2・§10、`docs/ARCHITECTURE.md` §5、`docs/UI_GUIDELINES.md` §4.2・§9.7、`docs/TEST_STRATEGY.md` §5、`docs/IMPLEMENTATION_PLAN.md`（M7：W16〜W18）
