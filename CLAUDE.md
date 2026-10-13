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
