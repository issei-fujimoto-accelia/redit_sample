---
created_at: 2026-10-13
status: created
---

# 003 認証ミドルウェアとテストヘルパー

元計画：[IMPLEMENTATION_PLAN.md W3](../docs/IMPLEMENTATION_PLAN.md#w3-認証ミドルウェアとテストヘルパー)

## Background

全操作がログイン前提で、認証は Cloudflare Access に委譲する。アプリ側では Access JWT を検証してユーザーを識別し、検証できなければ拒否する（fail closed）。以降の全テストが認証を通るため、早期に入れる。

## Dependencies

- 001

## Scope

- `src/middleware/auth.ts`：`Cf-Access-Jwt-Assertion` を `jose` の `jwtVerify` で検証（署名・`exp`・`iss`=`TEAM_DOMAIN`・`aud`=`POLICY_AUD`）、`email` を `ALLOWED_EMAIL_DOMAIN` で再確認し `c.var.user` に設定
- `AUTH_MODE=dev` のときだけ `DEV_USER_EMAIL` を使う開発モード
- テストヘルパー：アプリ生成（手動で進める時計・`createLocalJWKSet` の注入）、`tokenFor(email, overrides?)`、`as(email)`、`html(res)`
- 001 の tracer テストを `as(email)` 経由に置き換え

## Out of scope

- Origin 検証（004）
- 本番の Access アプリケーション設定（015）

## Implementation notes

- ARCHITECTURE §7.2〜7.3、ADR-6。
- 本番の JWKS は `createRemoteJWKSet(TEAM_DOMAIN + "/cdn-cgi/access/certs")`、テストはローカル JWKS を注入する。
- `AUTH_MODE` / `DEV_USER_EMAIL` は `.dev.vars` のみに書き、`wrangler.jsonc` には書かない。
- `as(email)` は自ホストの `Origin` も付ける（004 の CSRF 検証に備える）。

## Acceptance criteria

- [ ] 有効な JWT のリクエストだけが通り、それ以外は 403
- [ ] `AUTH_MODE` 未設定・その他の値では JWT 必須
- [ ] 共通 DoD

## Tests（S1：`test/http/auth.test.ts`）

- 有効な JWT → 200
- JWT なし → 403
- 署名不正（別の鍵）→ 403
- `aud` 不一致 → 403
- `iss` 不一致 → 403
- 期限切れ → 403
- 対象外ドメインのメール → 403
- `AUTH_MODE=dev` のとき JWT なしで `DEV_USER_EMAIL` として扱われる
