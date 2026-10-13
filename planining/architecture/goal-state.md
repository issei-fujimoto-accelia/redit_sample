# Goal State

## Goal
REQUIREMENTS.md を満たすシステム構成と責務を、Test Strategy と実装計画に進める状態まで確定する。

## Deliverable
`docs/ARCHITECTURE.md`（Data Design / API（ルーティング）/ Security / ADR / Operations を節として含む）

## Scope
- 入力：`spec/CONCEPT.md`、`docs/DOCUMENTATION_PLAN.md`、`docs/REQUIREMENTS.md`
- 含めない：テストツールの詳細（Test Strategy）、実装手順（Implementation Plan）

## Completion Criteria
- [x] 主要コンポーネントが明確
- [x] 責務境界が明確
- [x] 主要なデータフローが明確
- [x] 外部依存が明確
- [x] Requirements との矛盾がない
- [x] REQUIREMENTS §11 の引き継ぎ事項がすべて決まっている

## Decision Areas

### A. フロントエンド方式・フレームワーク（SSR / SPA）
Status: resolved

### B. 派生値（最終投稿日時・投稿数）の持ち方
Status: resolved
Known: D1 Free は行読み取り 500万/日、書き込み 10万/日。一覧は行読み取りが支配的。

### C. ユーザー・表示名の持ち方
Status: resolved

### D. デプロイ先と Access の設定
Status: resolved
Known: 個人アカウントでは *.i-fujimoto.workers.dev が Google 認証の Access で保護済み。

### E. ローカル開発時の認証
Status: resolved
Known: ローカルには Access がなく、Cf-Access-Jwt-Assertion が付かない。

### F. 細部（ID、ページング方式、CSRF、マイグレーション、障害時の挙動）
Status: resolved

## Decisions
- A: SSR。Hono＋JSX（hono/jsx）で1つの Worker が HTML を返す。更新はフォーム POST→リダイレクト（PRG）。クライアント JS は最小限。API_SPEC.md は作らない。
- B: threads に last_posted_at と post_count を保持し、投稿の作成・削除と同じ D1 batch で更新する。削除時の last_posted_at は残りの投稿の MAX(created_at) で再計算する。
- D: <アプリ名>.i-fujimoto.workers.dev にデプロイし、このホスト専用の Access アプリケーションを作る。ポリシーで特定メールドメインに限定し、専用 AUD で JWT を検証する。
- E: 認証を切り替え可能にし、ローカルでは環境変数 DEV_USER_EMAIL のユーザーとして扱う。本番では無効（既定は Access 検証、fail closed）。
- C: users テーブルは作らず、各行に作成者メールを保存。表示名は表示時に導出。
- F: INTEGER 自動採番、URL は /c/:id・/t/:id、同時刻は id 降順。?page=N の OFFSET。UTC ISO 8601 保存・JST 表示、編集済みは updated_at の有無。名前は trim 後 UNIQUE（NOCASE）。更新は POST のみ＋Origin 検証。削除の子要素チェックは DELETE 文の条件に含める。エラーは 400/403/404/409、D1 上限超過などは共通エラーページ。TypeScript、wrangler d1 migrations、KV 不使用、プレビュー URL 無効。層はルート→サービス→リポジトリ、ビューは JSX。

## Assumptions
- 編集フォームは各画面内に <details> で置き、JS なしで開閉する（画面数は Requirements の4画面のまま）。
- 多層防御として、アプリ側でもメールドメインを ALLOWED_EMAIL_DOMAIN で再確認する。
- `spec/CONCEPT.md` を Project Overview として扱う。

## Deferred
- テストツール（@cloudflare/vitest-pool-workers 等）の選定 → Test Strategy

## 調査結果（2026-10-13 時点の公式ドキュメント）
- Workers Free: 100,000 req/日（UTC 0時リセット）、CPU 10ms/リクエスト、サブリクエスト50、メモリ128MB
- D1 Free: 行読み取り 500万/日、行書き込み 10万/日、DB あたり 500MB、合計 5GB、1呼び出しあたりクエリ50。超過時はクエリがエラー
- Access JWT: ヘッダー `Cf-Access-Jwt-Assertion`、`https://<team>.cloudflareaccess.com/cdn-cgi/access/certs` の JWKS で検証、iss と aud を確認、`email` クレームでユーザー識別。`jose` 推奨
