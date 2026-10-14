# Issues

[docs/IMPLEMENTATION_PLAN.md](../docs/IMPLEMENTATION_PLAN.md) を Issue に分割したもの。1 Issue ＝ 計画の1作業（W1〜W15）。

各 Issue 共通の完了条件（共通 DoD）：`npm test` 全件成功、`npm run typecheck` エラーなし、対応する要件・受け入れ条件がテストで検証されている。画面を追加・変更する Issue（004b 以降）は、加えて [UI_GUIDELINES.md](../docs/UI_GUIDELINES.md) §9 のセルフチェックで合格している（対象はその Issue で触れた画面と状態）。

## 一覧

| # | Issue | 計画 | 依存 |
|---|---|---|---|
| 001 | [プロジェクト雛形とテスト基盤](001-scaffold-and-test-infra.md) | W1 | なし |
| 002 | [lib の純粋関数](002-lib-pure-functions.md) | W2 | 001（並行可） |
| 003 | [認証ミドルウェアとテストヘルパー](003-auth-middleware.md) | W3 | 001 |
| 004 | [共通ミドルウェア・レイアウト・エラーページ](004-common-middleware-layout-errors.md) | W4 | 003 |
| 004b | [UI 基盤とデザインシステム](004b-ui-foundation-and-design-system.md) | W4b | 004 |
| 005 | [コミュニティの作成と一覧](005-community-create-and-list.md) | W5 | 002、004b |
| 006 | [コミュニティの修正と削除（スレッドなし）](006-community-edit-and-delete.md) | W6 | 005 |
| 007 | [スレッドの作成とスレッドページ](007-thread-create-and-page.md) | W7 | 005 |
| 008 | [コミュニティページのスレッド一覧](008-community-thread-list.md) | W8 | 007 |
| 009 | [スレッドの修正・削除とコミュニティ削除の不可条件](009-thread-edit-delete-and-community-delete-guard.md) | W9 | 006、007 |
| 010 | [返信の投稿](010-reply-create.md) | W10 | 008 |
| 011 | [投稿の修正と返信の削除](011-post-edit-and-reply-delete.md) | W11 | 010 |
| 012 | [スレッド削除の不可条件（返信あり）](012-thread-delete-guard.md) | W12 | 009、011 |
| 013 | [ホームの横断スレッド一覧](013-home-cross-community-list.md) | W13 | 011 |
| 014 | [セキュリティ・表示の仕上げ](014-security-and-display-polish.md) | W14 | 012、013 |
| 015 | [本番環境の構築とデプロイ](015-production-deploy.md) | W15 | 014 |

### デザイン修正（2026-10-14）

各セットは「1. ドキュメントの確認・修正 → 2. コードの修正」の2 Issue で構成する。

| # | Issue | 種別 | 依存 |
|---|---|---|---|
| 016 | [［ドキュメント］コミュニティ作成を独立ページにする](016-docs-community-create-page.md) | ドキュメント | なし |
| 017 | [コミュニティ作成ページの実装](017-community-create-page.md) | コード | 016 |
| 018 | [［ドキュメント］スレッド作成ページとヘッダーの「投稿する」ボタン](018-docs-thread-create-page-and-post-button.md) | ドキュメント | 016 |
| 019 | [スレッド作成ページと「投稿する」ボタンの実装](019-thread-create-page-and-post-button.md) | コード | 018、017 |
| 020 | [［ドキュメント］返信フォームの簡略化](020-docs-reply-form-simplify.md) | ドキュメント | なし |
| 021 | [返信フォームの簡略化の実装](021-reply-form-simplify.md) | コード | 020 |

## 依存関係

```
001 ─┬─▶ 003 ─▶ 004 ─▶ 004b ─┐
002 ─┴───────────────────────┴─▶ 005 ─┬─▶ 006 ─────────────┐
                                      └─▶ 007 ─┬───────────┴─▶ 009 ─────────┐
                                               └─▶ 008 ─▶ 010 ─▶ 011 ─┬─▶ 012 ─┴─▶ 014 ─▶ 015
                                                                      └─▶ 013 ────▶ 014
```

並行可能：001/002、006/007、008/009、012/013。

デザイン修正の依存関係：

```
016 ─┬─▶ 017 ─┐
     └─▶ 018 ─┴─▶ 019
020 ───▶ 021
```

020/021 は 016〜019 と独立して進められる。

## 進め方

- Issue ごとにブランチを切って実装する。
- 着手時に `status: doing`、完了時に `status: done` に更新する。
- テストは各 Issue の「Tests」を1件ずつ red → green で進める。
