---
created_at: 2026-10-13
status: created
---

# 001 プロジェクト雛形とテスト基盤

元計画：[IMPLEMENTATION_PLAN.md W1](../docs/IMPLEMENTATION_PLAN.md#w1-プロジェクト雛形とテスト基盤)

## Background

以降のすべての作業は TDD で進めるため、Worker を Vitest（Workers ランタイム）でテストでき、ローカル D1 にマイグレーションが適用される状態を最初に作る。

## Dependencies

なし（002 と並行可）

## Scope

- `package.json`、`tsconfig.json`、`.gitignore`（`.dev.vars` を除外）、`.dev.vars.example`
- `wrangler.jsonc`（D1 binding `DB`、`workers_dev: true`、`preview_urls: false`）
- `vitest.config.ts`（`@cloudflare/vitest-plugin` の `cloudflareTest`、`readD1Migrations` → `TEST_MIGRATIONS`、`@vitest/coverage-istanbul`）
- `test/setup/apply-migrations.ts`（`applyD1Migrations`）
- `migrations/0001_init.sql`（ARCHITECTURE §4.2〜4.3 の全テーブル・インデックス）
- `src/index.ts`：`createApp({ now, jwks })` の骨格と `GET /` の仮レイアウト
- npm スクリプト：`dev`、`test`、`test:coverage`、`typecheck`、`db:migrate:local`、`db:migrate:remote`、`deploy`
- `CLAUDE.md` の「コマンド」節に上記スクリプトを記載

## Out of scope

- 認証（003）、Origin 検証・エラーページ（004）
- 業務ロジックと各画面

## Implementation notes

- `@cloudflare/vitest-plugin` に対応する Vitest のバージョンを導入前に公式ドキュメントで確認する。
- D1 で外部キー制約が有効か（`PRAGMA foreign_keys`）を確認する。無効なら作業を止め、ARCHITECTURE §4.1 の見直しをユーザーと相談する。
- 本番未デプロイのため、実装中は `0001_init.sql` を直接修正してよい。
- `createApp` は「現在時刻」と「JWKS」を外から注入できる形にする（TEST_STRATEGY §3.2）。

## Acceptance criteria

- [ ] `npm test` が成功する
- [ ] `npm run test:coverage` が Istanbul でレポートを出力する
- [ ] `npm run typecheck` がエラーなし
- [ ] `npm run db:migrate:local` → `npm run dev` でローカル起動できる
- [ ] 外部キー制約の確認結果が記録されている（PR 説明または ARCHITECTURE への追記）
- [ ] `CLAUDE.md` にコマンドが記載されている

## Tests

- S1（tracer）：`createApp` で生成したアプリに `GET /` を送ると 200 で、ホームとコミュニティ一覧へのリンクを含む HTML が返る（003 で `as(email)` 経由に置き換える）
