# デプロイ手順（Deploy Runbook）

Issue 015 の作業手順。Cloudflare アカウントの操作（`wrangler login`、D1 の作成、Access の設定、デプロイ）はユーザーが行う。
前提：コードと設定は Issue 001〜014、016〜021 で完成済み。`npm test`・`npm run typecheck` が成功していること。

## 1. ログインと本番 D1 の作成

```sh
npm install
npx wrangler login
npx wrangler d1 create redit-sample
```

出力された `database_id` を `wrangler.jsonc` の `d1_databases[0].database_id` に書き込む（現在は仮の値 `00000000-...`）。

## 2. マイグレーションと初回デプロイ

```sh
npm run db:migrate:remote
npm run deploy
```

- この時点では `vars` が空のため、すべてのリクエストが 403 になる（fail closed）。Access の設定前に中身が見えることはない。
- `preview_urls: false` のため、Access を通らないプレビュー URL は作られない。

## 3. Access の有効化（ADR-5）

Worker を先に作り、Worker の設定画面から Access を有効にする（ワンクリック Access）。

1. ダッシュボード → Workers & Pages → `redit-sample` → Settings → Domains & Routes を開く。
2. `workers.dev` の行で **Enable Cloudflare Access** を押す。このホスト名専用の Access アプリケーションが作られ、表示される画面に **AUD タグ** が出る（控える）。
   - Preview URL の行は操作不要（`preview_urls: false` で Preview URL 自体がない）。
3. Zero Trust → Access Controls → Applications → `redit-sample` を開き、次のとおり設定する。

| 項目 | 設定 |
|---|---|
| 認証（Authentication）タブ | ログイン方法は **Google のみ**（「使えるものをすべて許可」を外す。One-time PIN などは出さない）。Google だけなので **Instant Auth** を有効にしてよい |
| ポリシー | Action: **Allow**。Include: **Emails ending in `@<許可するドメイン>`**。Require: **Login Methods = Google** |

- Google のログイン方法そのもの（Client ID など）は Zero Trust → Settings → Authentication で登録済みであること。
- ログイン方法を Google にしただけではドメインは絞られない（どの Google アカウントでも認証は通る）。絞るのはポリシーの Include。
- **Login Methods は Include ではなく Require に入れる。** Include の条件は「または」で評価されるため、Include に両方入れると、Google でログインした全員が通ってしまう。
- 既存の `*.i-fujimoto.workers.dev`（Google 認証）のアプリケーションより、このホスト名専用のアプリケーションが優先される。
- AUD タグは、アプリケーションの Basic information（Overview）にある **Application Audience (AUD) Tag** でも確認できる。

## 4. 本番の環境変数と再デプロイ

`wrangler.jsonc` の `vars` に書く（いずれも秘密情報ではない）。

| 変数 | 値の例 | 確認場所 |
|---|---|---|
| `TEAM_DOMAIN` | `https://<team>.cloudflareaccess.com`（`https://` を含め、末尾の `/` なし） | Zero Trust → Settings のチーム名 |
| `POLICY_AUD` | 手順 3 で控えた AUD タグ | アプリケーションの Basic information |
| `ALLOWED_EMAIL_DOMAIN` | `example.com`（`@` なし） | ポリシーの Include と同じドメイン |

- 3つとも必須。いずれかが空のままだと、すべてのリクエストが 403 になる（fail closed）。
- `ALLOWED_EMAIL_DOMAIN` は多層防御。Access のポリシーに加えて、アプリ側でも JWT の `email` のドメインを確認する（ARCHITECTURE §7.2）。
- `AUTH_MODE` と `DEV_USER_EMAIL` は `wrangler.jsonc` に書かない（`.dev.vars` のみ）。

```sh
npm run deploy
```

## 5. 手動チェックリスト（TEST_STRATEGY §6）

- [ ] 対象ドメインの Google アカウントでログインし、全画面（作成ページを含む）で閲覧・投稿できる
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
| Access のログイン画面が出ない | Domains & Routes の `workers.dev` で Access が有効になっているか |
| 対象外ドメインの Google アカウントで入れてしまう | ポリシーの Login Methods が Include に入っていないか（Require に入れる）。アプリ側では `ALLOWED_EMAIL_DOMAIN` で 403 になる |
| Google 以外のログイン方法が出る | 認証タブで Google 以外が有効になっていないか |
| 500 / D1 のエラー | `database_id` の反映と `npm run db:migrate:remote` の実行 |

## 7. フリープランの上限（2026-10-14 に公式ドキュメントで再確認）

ARCHITECTURE §9.1 の値から変更なし（Workers：10万リクエスト/日、CPU 10 ms、サブリクエスト 50。D1：読み取り 500万行/日、書き込み 10万行/日、500 MB/DB、クエリ 50/呼び出し）。
