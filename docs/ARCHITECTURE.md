# アーキテクチャ（Architecture）

`docs/REQUIREMENTS.md` を満たすシステム構成と責務を定める。Data Design、ルーティング、Security、ADR、Operations は独立文書にせず、本書の節として扱う（`docs/DOCUMENTATION_PLAN.md` §3）。

## 1. システムコンテキスト

```
[ブラウザ]
   │ HTTPS
   ▼
[Cloudflare Access] ── Google 認証（特定メールドメインのみ許可）
   │ Cf-Access-Jwt-Assertion ヘッダーを付与
   ▼
[Worker：Hono アプリ] ── JWKS 取得 ──▶ https://<team>.cloudflareaccess.com/cdn-cgi/access/certs
   │ D1 binding (DB)
   ▼
[D1：SQLite]
```

| 外部依存 | 用途 | 備考 |
|---|---|---|
| Cloudflare Access | 認証、ドメイン限定 | 本アプリ専用の Access アプリケーションを作る（§7） |
| Google（IdP） | Access のログイン手段 | アプリから直接は呼ばない |
| Access 証明書エンドポイント | JWT 署名検証用の公開鍵（JWKS） | 鍵は定期的にローテーションされるため、`kid` で照合して取得する |
| D1 | 永続化 | 唯一のデータストア。KV は使わない |

## 2. 構成方針

- **SSR**：1つの Worker が Hono＋JSX（`hono/jsx`）で HTML を返す。SPA と JSON API は作らない（ADR-1）。
- **更新は PRG**：フォーム POST → 処理 → `303 See Other` でリダイレクト → GET で再表示。
- **クライアント JS は最小限**：削除確認（`confirm`）のみ。編集フォームは `<details>` で開閉し、JS に依存しない。
- **言語**：TypeScript。

## 3. コンポーネントと責務

```
src/
  index.ts            # Hono アプリの組み立て、ミドルウェア登録
  middleware/
    auth.ts           # ユーザー識別（Access JWT 検証 / 開発用ユーザー）
    origin.ts         # POST の Origin 検証（CSRF 対策）
    error.ts          # 例外 → エラーページ変換
  routes/             # HTTP 層：入力の取り出し、サービス呼び出し、レンダリング／リダイレクト
  services/           # 業務ルール：検証、権限、削除可否、派生値の更新
  repositories/       # D1 アクセス：SQL と batch（トランザクション）
  views/              # JSX：レイアウト、4画面、フォーム、エラーページ
    components/       # 共通部品（docs/UI_GUIDELINES.md §5）
  lib/                # 純粋関数：入力検証、表示名導出、日時変換、コミュニティ色相
public/               # Workers Static Assets：CSS、フォント（docs/UI_GUIDELINES.md §8）
scripts/design/       # デザイン確認用（スクリーンショット、axe）。npm test には含めない
migrations/
  0001_init.sql
wrangler.jsonc
```

| 層 | 責務 | 持たない責務 |
|---|---|---|
| middleware | 認証済みユーザー（メール）を `c.var.user` に設定。Origin 検証。例外の最終処理 | 業務ルール |
| routes | パス・クエリ・フォーム値の取り出し、サービス呼び出し、ステータスコードの決定、ビュー描画 | SQL、権限判定 |
| services | 入力検証、作成者本人チェック、削除可否、派生値（`last_posted_at`・`post_count`）を含む更新の組み立て | HTTP、HTML |
| repositories | SQL の発行、D1 batch による複数文の原子的実行 | 業務判断 |
| views | HTML の生成。表示名・JST 日時・「編集済み」の表示、作成者本人にのみ修正・削除操作を出す | データ取得 |
| lib | 文字数検証（trim 後）、表示名導出（`@` より前）、UTC→JST 変換、コミュニティ色相の導出 | 副作用 |

アプリは `createApp({ now, jwks })` のようなファクトリで生成し、「現在時刻」と「JWT 検証用の鍵セット（JWKS）」を外から注入できるようにする。本番は実時刻とリモート JWKS を渡し、テストは進められる時計とローカル JWKS を渡す（`docs/TEST_STRATEGY.md`）。

テストは HTTP 境界と lib の純粋関数で行い、services / repositories 単体のテストやテストダブルは作らない（`docs/TEST_STRATEGY.md` §2）。

## 4. データ設計

### 4.1 方針

- ユーザーのテーブルは作らない。各行に作成者のメールアドレスを保存し、表示名は表示時に導出する（ADR-4）。
- ID は `INTEGER PRIMARY KEY AUTOINCREMENT`。URL には ID を使う（名前・タイトルは修正可能なため）。
- 日時は UTC の ISO 8601 文字列（`YYYY-MM-DDTHH:mm:ss.sssZ` 固定長）で保存する。固定長なので文字列比較で順序が保たれる。表示時に JST へ変換する。
- `updated_at` は作成時 `NULL`、修正時に設定する。`NULL` でなければ「編集済み」を表示する。
- スレッドの最終投稿日時と投稿数は `threads` に保持し、投稿の作成・削除と同じ batch で更新する（ADR-3）。
- 外部キーを張り、子要素がある親は削除できないようにする（D1 は外部キー制約を既定で有効にしている。ローカル D1 で `PRAGMA foreign_keys` が `1` であり、存在しない親を参照する INSERT が失敗することを確認済み：Issue 001）。

### 4.2 テーブル

**communities**

| 列 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | INTEGER | PK, AUTOINCREMENT | |
| name | TEXT | NOT NULL, UNIQUE, `COLLATE NOCASE` | trim 後の値。英字の大小を区別せず一意 |
| description | TEXT | NOT NULL, DEFAULT `''` | 任意入力 |
| author_email | TEXT | NOT NULL | 作成者 |
| created_at | TEXT | NOT NULL | |
| updated_at | TEXT | NULL | |

**threads**

| 列 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | INTEGER | PK, AUTOINCREMENT | |
| community_id | INTEGER | NOT NULL, FK → communities.id | |
| title | TEXT | NOT NULL | |
| author_email | TEXT | NOT NULL | スレッド作成者（＝本文の投稿者） |
| created_at | TEXT | NOT NULL | |
| updated_at | TEXT | NULL | タイトル修正時に設定 |
| last_posted_at | TEXT | NOT NULL | 残っている投稿の最新 `created_at` |
| post_count | INTEGER | NOT NULL | 本文を含む投稿数（1以上） |

**posts**

| 列 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | INTEGER | PK, AUTOINCREMENT | |
| thread_id | INTEGER | NOT NULL, FK → threads.id | |
| is_opening | INTEGER | NOT NULL, DEFAULT 0 | 1 = 本文。スレッドごとに1件（部分 UNIQUE インデックス） |
| body | TEXT | NOT NULL | プレーンテキスト |
| author_email | TEXT | NOT NULL | |
| created_at | TEXT | NOT NULL | |
| updated_at | TEXT | NULL | |

### 4.3 インデックス

| インデックス | 用途 |
|---|---|
| `threads(last_posted_at DESC, id DESC)` | ホームの一覧 |
| `threads(community_id, last_posted_at DESC, id DESC)` | コミュニティページの一覧、コミュニティ削除時の存在確認 |
| `posts(thread_id, created_at, id)` | スレッドページの投稿一覧、最終投稿日時の再計算 |
| `posts(thread_id) WHERE is_opening = 1`（UNIQUE） | 本文はスレッドに1件 |

### 4.4 更新処理と整合性

複数文の更新は D1 の `batch`（1トランザクション）で実行する。

| 操作 | batch の内容 |
|---|---|
| スレッド作成 | `threads` を INSERT（`post_count = 1`、`last_posted_at = created_at`）→ 本文を `posts` に INSERT（`is_opening = 1`、`thread_id` は `last_insert_rowid()`） |
| 返信作成 | `posts` を INSERT → `threads` の `post_count + 1`、`last_posted_at = 作成日時` |
| 返信削除 | `posts` を DELETE（`is_opening = 0` かつ本人のもの）→ `threads` の `post_count` と `last_posted_at` を残りの投稿から再計算（`COUNT(*)`、`MAX(created_at)`） |
| スレッド削除 | 本文を DELETE（返信が存在しない条件付き）→ `threads` を DELETE（投稿が存在しない、かつ本人の条件付き） |
| コミュニティ削除 | `communities` を DELETE（スレッドが存在しない、かつ本人の条件付き） |

- 削除可否・本人確認は、事前チェックに加え **DELETE 文の条件にも含める**。同時に返信が投稿されても、子要素を残したまま親が消えることはない。条件不一致で0行になった場合、サービス層が原因（未検出／本人でない／子要素あり）を判別してエラーにする。
- 返信削除で `post_count` を減算ではなく再計算にするのは、競合時のずれを残さないため。
- 修正（タイトル・本文・コミュニティ）は1文の UPDATE で、`WHERE id = ? AND author_email = ?` とする。`last_posted_at` は変えない。

### 4.5 主要クエリと D1 行読み取りの見積もり

| 画面 | クエリ | 読み取り行数の目安 |
|---|---|---|
| ホーム | `threads` を `last_posted_at DESC, id DESC` で `LIMIT 20 OFFSET (page-1)*20`、`communities` を JOIN | 約 20×page＋20 |
| コミュニティ一覧 | `communities` を `name` 順で全件 | コミュニティ数 |
| コミュニティページ | 該当 community＋その threads を同順で LIMIT/OFFSET | 約 20×page＋1 |
| スレッドページ | 該当 thread＋posts 全件 | 投稿数＋1 |

数名の利用では、1日の読み取りは数千〜数万行程度と見込む。Free 枠（500万行/日）に対して十分に余裕がある。

### 4.6 マイグレーション

- `wrangler d1 migrations` を使い、`migrations/NNNN_*.sql` で管理する。
- ローカル（`--local`）で適用・確認してから本番（`--remote`）に適用する。
- 長期運用しないため、後方互換のための段階的移行は行わない。

## 5. ルーティング

HTML フォームから送信するため、更新系はすべて POST とする。成功時は 303 でリダイレクトする。

| メソッド | パス | 処理 | 成功時 |
|---|---|---|---|
| GET | `/` | ホーム（`?page=N`） | 200 |
| GET | `/c` | コミュニティ一覧 | 200 |
| POST | `/c` | コミュニティ作成 | 303 → `/c/:id` |
| GET | `/c/:id` | コミュニティページ（`?page=N`） | 200 |
| POST | `/c/:id/edit` | 名前・説明の修正 | 303 → `/c/:id` |
| POST | `/c/:id/delete` | コミュニティ削除 | 303 → `/c` |
| POST | `/c/:id/threads` | スレッド作成（タイトル＋本文） | 303 → `/t/:id` |
| GET | `/t/:id` | スレッドページ | 200 |
| POST | `/t/:id/edit` | タイトルの修正 | 303 → `/t/:id` |
| POST | `/t/:id/delete` | スレッド削除 | 303 → `/c/:community_id` |
| POST | `/t/:id/posts` | 返信の投稿 | 303 → `/t/:id#post-:postId` |
| POST | `/p/:id/edit` | 投稿本文の修正 | 303 → `/t/:thread_id#post-:id` |
| POST | `/p/:id/delete` | 返信の削除 | 303 → `/t/:thread_id` |

- `page` が数値でない、または1未満の場合は1として扱う。範囲外のページは空の一覧を表示する。
- 編集フォームは各画面に `<details>` で置く。画面数は Requirements の4画面のまま。
- 開発用に `GET /_styleguide`（共通部品の一覧）を置く。`AUTH_MODE=dev` のときだけ有効で、それ以外は 404（`docs/UI_GUIDELINES.md` §8.3）。
- 見た目の方針と品質基準は `docs/UI_GUIDELINES.md` に従う。

### 5.1 エラー応答

| 状況 | ステータス | 表示 |
|---|---|---|
| 入力検証エラー | 400 | 元の画面を、入力値とエラーメッセージ付きで再描画 |
| コミュニティ名の重複 | 409 | 同上 |
| 子要素があり削除できない | 409 | 元の画面を、削除できない理由付きで再描画 |
| 作成者本人でない | 403 | 共通エラーページ |
| 認証失敗、Origin 不一致 | 403 | 共通エラーページ |
| 対象が存在しない | 404 | 共通エラーページ（見つからない旨） |
| D1 の上限超過・その他の例外 | 503 / 500 | 共通エラーページ（時間をおいて再試行を案内） |

## 6. データフロー

### 6.1 閲覧（例：ホーム）

```
GET / ─▶ auth ─▶ routes/home ─▶ services.listThreads(page)
                                    └▶ repositories: SELECT threads JOIN communities LIMIT 20 OFFSET n
       ◀─ 200 HTML ◀─ views/Home（表示名導出、JST 変換、本人なら操作表示）
```

### 6.2 更新（例：返信の投稿）

```
POST /t/:id/posts ─▶ auth ─▶ origin ─▶ routes/thread
   ─▶ services.reply(user, threadId, body)
        ├ 入力検証（trim 後 1〜10,000 文字）→ NG なら 400 で再描画
        ├ スレッド存在確認 → なければ 404
        └ repositories.batch[INSERT posts, UPDATE threads]
   ◀─ 303 → /t/:id#post-:postId
```

## 7. 認証・セキュリティ

### 7.1 Cloudflare Access

- `<アプリ名>.i-fujimoto.workers.dev` に、本アプリ専用の Access アプリケーションを作る。
- ポリシーで、特定ドメインのメールアドレスを持つ Google アカウントのみを許可する。
- workers.dev のプレビュー URL は無効化し、Access を通らない経路を作らない。

### 7.2 アプリ側の JWT 検証（auth ミドルウェア）

全リクエストに適用する。

1. `Cf-Access-Jwt-Assertion` ヘッダーを取得する。ない場合は 403。
2. `jose` の `createRemoteJWKSet` で `${TEAM_DOMAIN}/cdn-cgi/access/certs` から鍵を取得し、`jwtVerify` で署名・有効期限・`iss`（`TEAM_DOMAIN`）・`aud`（`POLICY_AUD`）を検証する。失敗時は 403。
3. `email` クレームを取り出す。多層防御として `ALLOWED_EMAIL_DOMAIN` のドメインかを再確認し、違えば 403。
4. メールアドレスを `c.var.user` に設定する。

### 7.3 ローカル開発時の認証

- 環境変数 `AUTH_MODE` で切り替える。`AUTH_MODE=dev` のときだけ、JWT を検証せず `DEV_USER_EMAIL` のユーザーとして扱う。
- `AUTH_MODE` が未設定・その他の値の場合は Access 検証を行う（fail closed）。
- `AUTH_MODE=dev` と `DEV_USER_EMAIL` は `.dev.vars`（Git 管理外）にのみ書き、`wrangler.jsonc` の本番設定には書かない。
- 複数ユーザーでの動作確認は、`DEV_USER_EMAIL` を切り替えて行う。リクエスト側からユーザーを切り替える手段は設けない。

### 7.4 その他

| 脅威 | 対策 |
|---|---|
| XSS | JSX の自動エスケープに任せる。生 HTML の挿入（`dangerouslySetInnerHTML` 等）は使わない。改行は CSS（`white-space: pre-wrap`）で表示する |
| CSRF | 更新系（GET/HEAD/OPTIONS 以外）のリクエストで、`Origin` ヘッダーが自ホストと一致することを必須とする（自前の `origin` ミドルウェア。Hono の `csrf` はフォーム系 Content-Type のみを検査するため使わない：Issue 004）。Access の Cookie も補助的な防御になる |
| 他人のリソースの操作 | サービス層で本人確認し、UPDATE / DELETE 文にも `author_email = ?` を含める |
| SQL インジェクション | D1 のプリペアドステートメント（`bind`）のみを使う |

## 8. 障害時の挙動

| 事象 | 挙動 |
|---|---|
| Workers のリクエスト上限超過（10万/日） | Cloudflare が Error 1027 を返す。アプリでは扱わない。UTC 0時（JST 9時）にリセット |
| D1 の行読み書き上限超過 | クエリがエラーになり、共通エラーページ（503）を表示。UTC 0時にリセット |
| JWKS の取得失敗 | 検証できないため 403。fail closed |
| batch 途中の失敗 | トランザクションごとロールバックされる。共通エラーページ（500） |

監視・アラートは設けない（長期運用しないため）。

## 9. デプロイと運用

| 項目 | 内容 |
|---|---|
| デプロイ先 | `<アプリ名>.i-fujimoto.workers.dev`（Workers Free） |
| 設定ファイル | `wrangler.jsonc`（D1 binding `DB`、`assets.directory: "./public"`、`workers_dev: true`、`preview_urls: false`、`vars` に本番の Access 設定） |
| 手順書 | `docs/DEPLOY.md` |
| 環境変数 | `TEAM_DOMAIN`、`POLICY_AUD`、`ALLOWED_EMAIL_DOMAIN`（本番）／`AUTH_MODE`、`DEV_USER_EMAIL`（ローカルのみ、`.dev.vars`） |
| デプロイ | `wrangler d1 migrations apply <DB> --remote` → `wrangler deploy`（手動） |
| ローカル実行 | `wrangler d1 migrations apply <DB> --local` → `wrangler dev` |
| CI/CD | 設けない |

### 9.1 フリープランの上限（2026-10-13 時点の公式ドキュメント。2026-10-14 に再確認し変更なし）

| 対象 | 上限 | 本アプリでの見込み |
|---|---|---|
| Workers リクエスト | 100,000 / 日 | 数名利用のため十分に下回る |
| Workers CPU 時間 | 10 ms / リクエスト | SSR は軽量な JSX のみ。JWT 検証は WebCrypto を使う。超過時は実装で計測して見直す |
| Workers サブリクエスト | 50 / 呼び出し | JWKS 取得の1件程度 |
| D1 行読み取り | 5,000,000 / 日 | §4.5 の見積もりで十分に下回る |
| D1 行書き込み | 100,000 / 日 | 1操作あたり数行（インデックス更新を含む） |
| D1 ストレージ | 500 MB / DB | テキストのみで十分に下回る |
| D1 クエリ数 | 50 / 呼び出し | 1リクエストあたり数クエリ |

上限値は変更されうる。デプロイ前に公式ドキュメントで再確認する。

## 10. 技術判断（ADR）

### ADR-1：SSR（Hono＋JSX）を採用する

- **Context**：4画面のフォーム中心のアプリ。Workers Free は CPU 10 ms／リクエスト。
- **Decision**：Hono＋`hono/jsx` で SSR し、更新は PRG とする。
- **Alternatives**：React Router v7 の SSR（バンドルと CPU 消費が大きい）、SPA＋JSON API（API 仕様書とクライアント実装が増える）。
- **Consequences**：構成とテストが最小になる。リッチな画面操作（インライン編集の即時反映など）はできない。

### ADR-2：データストアは D1 のみとし、KV は使わない

- **Context**：データはリレーショナルで、件数は小さい。
- **Decision**：D1 のみを使う。
- **Alternatives**：一覧のキャッシュに KV を使う。
- **Consequences**：整合性の管理が1か所で済む。読み取り量は D1 の枠で十分に収まる（§4.5）。

### ADR-3：最終投稿日時と投稿数を threads に保持する

- **Context**：スレッド一覧は最終投稿日時で並べ替えてページングする。都度集計では、一覧のたびに全投稿を走査する。
- **Decision**：`threads.last_posted_at` と `threads.post_count` を保持し、投稿の作成・削除と同じ batch で更新する。
- **Alternatives**：`posts` を都度 GROUP BY する。
- **Consequences**：一覧がインデックスだけで読める。更新漏れのリスクがあるため、作成・削除時の派生値をテストで担保する。

### ADR-4：ユーザーテーブルを作らない

- **Context**：表示名はメールアドレスの `@` より前で、設定機能はない。ユーザー属性は他にない。
- **Decision**：各行に `author_email` を保存し、表示名は表示時に導出する。
- **Alternatives**：`users` テーブルを作り、初回アクセス時に登録する。
- **Consequences**：スキーマと処理が単純になる。表示名の規則を変える場合も、導出関数の修正だけで済む。

### ADR-5：専用の Access アプリケーションで保護する

- **Context**：`*.i-fujimoto.workers.dev` には既存の Google 認証ポリシーがある。要件は特定ドメインのみの許可。
- **Decision**：このホスト専用の Access アプリケーションを作り、ドメイン限定のポリシーと専用の AUD を使う。
- **Alternatives**：既存のワイルドカードのアプリケーションを流用する。独自ドメインを使う。
- **Consequences**：アプリ単位で許可範囲と AUD を管理できる。Access の設定作業が1つ増える。

### ADR-6：ローカル開発では環境変数で開発用ユーザーを指定する

- **Context**：ローカルには Access がなく、JWT が届かない。
- **Decision**：`AUTH_MODE=dev` のときだけ `DEV_USER_EMAIL` を使う。既定は Access 検証（fail closed）。
- **Alternatives**：開発用ヘッダーでユーザーを切り替える。cloudflared で本物の Access を通す。
- **Consequences**：設定が簡単で、本番での誤有効化リスクが小さい。複数ユーザーの確認には環境変数の切り替えと再起動が必要になる。

## 11. Requirements との対応

| Requirements | 対応する設計 |
|---|---|
| FR-C-1（Access で識別） | §7.1〜7.2 |
| FR-C-2（表示名） | ADR-4、lib の表示名導出 |
| FR-C-3（JST 表示） | §4.1、lib の日時変換 |
| FR-C-4（本人のみ修正・削除） | §7.4、§4.4 |
| FR-C-5（削除確認、物理削除） | §2（`confirm`）、§4.4 |
| FR-C-7（未検出） | §5.1（404） |
| 6.2 入力制約・一意性 | lib の検証、§4.2 の `UNIQUE COLLATE NOCASE` |
| FR-CM-4、FR-T-7、FR-P-5（削除条件） | §4.4 |
| FR-T-2〜3（並び順、ページング） | §4.3、§4.5、§5 |
| FR-T-4（一覧の項目） | §4.2（`post_count`、`last_posted_at`） |
| FR-P-6（最終投稿日時の更新） | §4.4、ADR-3 |
| NFR-2（無料枠） | §4.5、§9.1 |

## 12. テスト方針

`docs/TEST_STRATEGY.md` を参照。テストのシームは HTTP 境界（ローカル D1 を使用）と lib の純粋関数の2つとする。
