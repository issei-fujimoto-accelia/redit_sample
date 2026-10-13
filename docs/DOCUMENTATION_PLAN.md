# ドキュメント計画（Documentation Plan）

`spec/CONCEPT.md`（Project Overview に相当）を基に、実装前に作成するドキュメントと作成順序を定める。

## 1. 評価

| 観点 | 評価 | 根拠 |
|---|---|---|
| 規模 | 小 | 利用者は数名。画面4つ、エンティティ4つ（User / Community / Thread / Post）の CRUD |
| 複雑性 | 低〜中 | 業務ロジックは単純。ただし「子要素ありは削除不可」「最初の投稿の扱い」「最終投稿順の並び」に細かな仕様判断が残る |
| リスク | 低 | 長期運用なし、一般公開なし、認証は Cloudflare Access に委譲。注意点は Access の JWT 検証漏れと、無料枠（リクエスト数・D1 行読み書き・CPU 時間）の超過 |

結論：**小規模**として扱う。基本セット（Requirements / Architecture / Test Strategy）の3文書とし、他の関心事は各文書のセクションに含める。

## 2. 作成するドキュメントと順序

| 順 | ドキュメント | ファイル | 目的 |
|---|---|---|---|
| 1 | Requirements | `docs/REQUIREMENTS.md` | 機能要件・非機能要件・受け入れ条件を確定する |
| 2 | Architecture | `docs/ARCHITECTURE.md` | 構成、データモデル、ルーティング、認証連携、無料枠対策を確定する |
| 3 | Test Strategy | `docs/TEST_STRATEGY.md` | TDD で進めるためのテスト階層・ツール・対象範囲を確定する |

### 順序の理由

1. **Requirements を最初に作る。** 概念設計の未決事項のうち3件（最初の投稿の扱い、表示名、スパム対策）が要件レベルの判断であり、これが決まらないとデータモデルと画面遷移が確定しない。
2. **Architecture を次に作る。** 残りの未決事項（SSR か SPA か）はここで決める。この選択が API の形と Data Design の粒度を左右するため、Requirements の後に置く。
3. **Test Strategy を最後に作る。** テスト対象の境界（Workers のハンドラ、D1 アクセス、Access の JWT 検証）は Architecture で決まるため、その後に置く。implementation-planning は TDD 前提なので、ここで実行環境（例：Workers 向けのテストランナー、D1 のローカル実行）まで決めておく。

## 3. 他の文書に含める関心事

独立した文書は作らず、以下のセクションとして扱う。

| 関心事 | 含める先 | 内容 |
|---|---|---|
| UX / User Flow | Requirements | 4画面の遷移、スレッド作成（タイトル＋最初の投稿）、削除不可時の表示 |
| Privacy | Requirements | メールアドレスを表示するか（表示名の扱い） |
| Data Design | Architecture | D1 のテーブル定義、外部キー、最終投稿日時の持ち方、インデックス |
| API Spec | Architecture | ルーティング一覧（パス、メソッド、権限） |
| Security Design | Architecture | Access JWT（`Cf-Access-Jwt-Assertion`）の検証、作成者本人チェック、CSRF 対策の要否 |
| ADR | Architecture | 主要な選択（SSR/SPA、D1 の採用、KV を使うか）を「決定事項と理由」の節に短く記録 |
| Operations | Architecture | デプロイ手順、D1 マイグレーション、無料枠の上限値の確認結果 |

## 4. 作らない文書

| 文書 | 理由 |
|---|---|
| Sync / State Design | リアルタイム同期・オフライン対応がない |
| 独立した Security / Privacy Design | 認証は Access に委譲、利用者は特定ドメインの数名に限定 |
| 独立した ADR 群 | 決定事項が少ない。Architecture 内の節で足りる |

## 5. 見直し条件

以下に該当した場合は、該当箇所を独立した文書に切り出す。

- Architecture で **SPA** を選び、API が画面と独立した契約になる場合 → `API_SPEC.md` を追加する。
- 無料枠の制約から、集計値のキャッシュや KV の併用など**データ設計が複雑化**した場合 → `DATA_DESIGN.md` を追加する。

## 6. 概念設計の未決事項の割り当て

| 未決事項 | 決める文書 |
|---|---|
| スレッドの最初の投稿の扱い（削除可否、スレッド削除の手順） | Requirements |
| ユーザーの表示名 | Requirements（方針）／ Architecture（データ上の持ち方） |
| スパム対策の要否 | Requirements |
| フロントエンドの方式（SSR / SPA） | Architecture |
