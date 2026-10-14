# デプロイ手順（Deploy Runbook）

Issue 015 の作業手順。Cloudflare アカウントの操作（`wrangler login`、D1 の作成、Access の設定、デプロイ）はユーザーが行う。
前提：コードと設定は Issue 001〜014 で完成済み。`npm test`・`npm run typecheck` が成功していること。

## 1. ログインと本番 D1 の作成

```sh
npm install
npx wrangler login
npx wrangler d1 create redit-sample
```

出力された `database_id` を `wrangler.jsonc` の `d1_databases[0].database_id` に書き込む（現在は仮の値 `00000000-...`）。

## 2. Access アプリケーションの作成（ADR-5）

Cloudflare ダッシュボード → Zero Trust → Access → Applications → Add an application → Self-hosted。

| 項目 | 値 |
|---|---|
| Application domain | `redit-sample.i-fujimoto.workers.dev`（Worker 名 `redit-sample` の場合） |
| Identity provider | Google |
| Policy | Action: Allow、Include: Emails ending in `@<許可するドメイン>` |

- 既存の `*.i-fujimoto.workers.dev`（Google 認証）より具体的なホスト名のアプリケーションが優先される。
- 作成後、アプリケーションの Overview にある **Application Audience (AUD) Tag** を控える。
- チームドメインは Zero Trust → Settings → Custom Pages などに表示される `https://<team>.cloudflareaccess.com`。

## 3. 本番の環境変数

`wrangler.jsonc` の `vars` に書く（いずれも秘密情報ではない）。

| 変数 | 値の例 |
|---|---|
| `TEAM_DOMAIN` | `https://<team>.cloudflareaccess.com`（`https://` を含め、末尾の `/` なし） |
| `POLICY_AUD` | 手順 2 で控えた AUD タグ |
| `ALLOWED_EMAIL_DOMAIN` | `example.com`（`@` なし） |

- いずれかが空のままだと、すべてのリクエストが 403 になる（fail closed）。
- `AUTH_MODE` と `DEV_USER_EMAIL` は `wrangler.jsonc` に書かない（`.dev.vars` のみ）。

## 4. マイグレーションとデプロイ

```sh
npm run db:migrate:remote
npm run deploy
```

- `preview_urls: false` のため、Access を通らないプレビュー URL は作られない。

## 5. 手動チェックリスト（TEST_STRATEGY §6）

- [ ] 対象ドメインの Google アカウントでログインし、4画面を閲覧・投稿できる
- [ ] 対象外ドメインの Google アカウントではログインできない
- [ ] workers.dev のプレビュー URL が無効になっている
- [ ] 削除時に確認ダイアログが表示され、キャンセルすると削除されない
- [ ] 編集フォーム（`<details>`）が JS なしで開閉できる
- [ ] 投稿本文の改行がそのまま表示される
- [ ] スマートフォンの画面幅で、各画面の閲覧と投稿ができる
- [ ] 本番の JWKS 取得で JWT 検証が通る（ログインできることで確認）
- [ ] Cloudflare ダッシュボードで、CPU 時間が 10 ms 以内に収まっている

## 6. うまくいかないとき

| 症状 | 確認すること |
|---|---|
| ログイン後も 403 | `TEAM_DOMAIN`（`https://` の有無、末尾 `/`）、`POLICY_AUD`、`ALLOWED_EMAIL_DOMAIN` の値 |
| Access のログイン画面が出ない | Access アプリケーションのドメインが Worker のホスト名と一致しているか |
| 500 / D1 のエラー | `database_id` の反映と `npm run db:migrate:remote` の実行 |

## 7. フリープランの上限（2026-10-14 に公式ドキュメントで再確認）

ARCHITECTURE §9.1 の値から変更なし（Workers：10万リクエスト/日、CPU 10 ms、サブリクエスト 50。D1：読み取り 500万行/日、書き込み 10万行/日、500 MB/DB、クエリ 50/呼び出し）。
