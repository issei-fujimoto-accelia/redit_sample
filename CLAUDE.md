# claude.md

./spec/CONCEPT.md が一次ドキュメントです。明示的な指示があるまで修正はしないでください。
./docs/ に要件やアーキテクチャ、テスト方針などのドキュメントが配置されます。

## コマンド

| コマンド | 内容 |
|---|---|
| `npm run dev` | ローカル起動（`wrangler dev`）。事前に `.dev.vars.example` を `.dev.vars` にコピーする |
| `npm test` | テスト（Vitest＋Workers ランタイム） |
| `npm run test:coverage` | テスト＋カバレッジ（Istanbul、`coverage/`） |
| `npm run typecheck` | 型チェック（`tsc --noEmit`） |
| `npm run db:migrate:local` | ローカル D1 にマイグレーションを適用 |
| `npm run db:migrate:remote` | 本番 D1 にマイグレーションを適用 |
| `npm run deploy` | 本番デプロイ（`wrangler deploy`） |
| `npm run design:seed` | 画面確認用のデータを投入（`AUTH_MODE=dev` で起動したサーバーに対して） |
| `npm run design:capture` | スクリーンショットを `design/rounds/NN/` に保存（Playwright。初回は `npx playwright install chromium`） |
| `npm run design:audit` | axe によるアクセシビリティチェック |
| `npm run design:budget` | CSS・フォントの容量予算の確認 |
