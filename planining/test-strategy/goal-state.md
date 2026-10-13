# Goal State

## Goal
要件と主要リスクをどのテストで検証するかを、TDD で実装計画を立てられる状態まで確定する。

## Deliverable
`docs/TEST_STRATEGY.md`

## Scope
- 入力：CONCEPT / DOCUMENTATION_PLAN / REQUIREMENTS / ARCHITECTURE、implementation-planning の references/tdd.md
- tdd.md の要請：テストは事前合意したシーム（公開境界）でのみ書く → シームをここで合意する

## Completion Criteria
- [x] 主要な要件に検証方法がある
- [x] テストレベルの役割分担（シーム）が明確
- [x] 重要な統合部分（D1 batch、Access JWT）の検証方法が明確
- [x] 実行環境・外部依存の扱いが明確
- [x] ライブラリとカバレッジ方針が明確
- [x] 主要な未検証リスクが把握されている

## Decision Areas
### A. シーム（テストレベルの分担）
Status: resolved
Known: ARCHITECTURE §12 は lib / services（テストダブル）/ repositories / routes の4層を候補として挙げた。tdd.md は内部協調者のモックを anti-pattern とする。
### B. E2E（ブラウザ）テストの要否
Status: resolved
### C. カバレッジ方針
Status: resolved
Known: Workers ランタイムでは V8 カバレッジ非対応、Istanbul のみ。
### D. ツール・環境・外部依存（JWT、時刻）
Status: resolved
### E. 手動テスト
Status: resolved

## Decisions
- A: シームは2つ。①HTTP 境界（Worker へのリクエスト、ローカル D1 実体）②lib の純粋関数。services / repositories の単体テストは書かない。ARCHITECTURE §3・§12 のテストダブル記述を修正する。
- B: ブラウザ E2E は作らない。ブラウザ依存の確認は手動チェックリストで行う。
- C: Istanbul で計測し、行カバレッジ 80% を閾値とする（未満で失敗）。
- D: Vitest＋@cloudflare/vitest-plugin＋@vitest/coverage-istanbul、tsc --noEmit も合格条件。マイグレーションは setupFiles で適用。データ作成・確認は HTTP 経由。テストも Access 検証経路を通し、テスト鍵で署名した JWT でユーザー切替。AUTH_MODE=dev は別途数件。createApp で now と jwks を注入。HTML はステータス・Location・テキスト・要素で検証しヘルパーに集約。CI なし、コミット前にローカル全件。
- E: 手動（デプロイ後）：Access 実ログイン、対象外ドメイン拒否、プレビュー URL 無効、confirm・<details>、スマホ幅、CPU 時間。
## Assumptions
- 分離ストレージはファイル単位のため、件数・並び順に依存するテストは専用ファイルに分ける。
- ARCHITECTURE §3・§12 を本方針に合わせて修正済み。
## Deferred

## 調査結果（2026-10-13）
- `@cloudflare/vitest-pool-workers` は 2026-08-19 に `@cloudflare/vitest-plugin`（v1）へ改名。設定 API は不変。設定は `cloudflareTest({ wrangler: { configPath } })`
- D1：`readD1Migrations` → `TEST_MIGRATIONS` バインディング → setupFiles で `applyD1Migrations`
- 分離ストレージはテストファイル単位（ファイル終了時に書き込みを取り消し）
- カバレッジは Istanbul のみ（V8 非対応）
- 外部リクエストのモックは `@msw/cloudflare` 連携
