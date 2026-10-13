---
created_at: 2026-10-13
status: created
---

# 015 本番環境の構築とデプロイ

元計画：[IMPLEMENTATION_PLAN.md W15](../docs/IMPLEMENTATION_PLAN.md#w15-本番環境の構築とデプロイ)

## Background

Workers Free と D1 に本番環境を作り、専用の Cloudflare Access アプリケーションで保護してデプロイする。自動テストでは検証できない項目を手動で確認する。

## Dependencies

- 014

## Scope

- 本番 D1 の作成と `wrangler.jsonc` への `database_id` 反映
- 本アプリ専用の Access アプリケーション作成（特定ドメインの Google アカウントのみ許可）と AUD の取得（ADR-5）
- 本番の環境変数：`TEAM_DOMAIN`、`POLICY_AUD`、`ALLOWED_EMAIL_DOMAIN`
- `npm run db:migrate:remote` → `npm run deploy`
- フリープランの上限値の再確認（ARCHITECTURE §9.1 を必要に応じて更新）
- `TEST_STRATEGY.md` §6 の手動チェックリストの実施

## Out of scope

- CI/CD、監視・アラート（設けない）

## Implementation notes

- Cloudflare ダッシュボードでの設定作業はユーザーと一緒に進める（アカウント操作を含むため）。
- `AUTH_MODE` / `DEV_USER_EMAIL` が本番設定に含まれていないことを確認する。
- workers.dev のプレビュー URL は無効（`preview_urls: false`）にする。

## Acceptance criteria

- [ ] 本番 URL が Access で保護され、対象ドメインのアカウントのみログインできる
- [ ] TEST_STRATEGY §6 の手動チェックリストが全項目合格
- [ ] 上限値の確認結果が ARCHITECTURE §9.1 に反映されている

## Tests

- 自動テストなし。手動チェックリスト（TEST_STRATEGY §6）：
  - 対象ドメインでログインし、4画面を閲覧・投稿できる
  - 対象外ドメインではログインできない
  - プレビュー URL が無効
  - 削除の確認ダイアログでキャンセルすると削除されない
  - 編集フォーム（`<details>`）が JS なしで開閉できる
  - 改行がそのまま表示される
  - スマートフォン幅で閲覧・投稿できる
  - 本番 JWKS で JWT 検証が通る
  - CPU 時間が 10 ms 以内
