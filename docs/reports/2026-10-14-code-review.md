# コードレビュー：ドキュメント準拠の確認（2026-10-14）

## 対象と方法

| 項目 | 内容 |
|---|---|
| 対象 | `main` の HEAD `d5cb8c4c1a660bacbc4d3f48a8a483641b8a010d`（Issue 001〜021 マージ済み） |
| 基準 | `spec/CONCEPT.md`（一次）、`docs/REQUIREMENTS.md`、`docs/ARCHITECTURE.md`、`docs/UI_GUIDELINES.md`、`CLAUDE.md` |
| 範囲 | `src/`、`migrations/`、`public/assets/app.css`、`wrangler.jsonc`、`design/rounds/*/review.md`（採点結果の確認のみ） |
| 方法 | 静的レビュー。ビルド・型チェック・テストは実行していない（CI 相当で別途実行する前提） |

- 対象の Pull Request がないため、`/code-review` の手順のうち PR の適格性確認と GitHub へのコメント投稿は行わず、本レポートに置き換えた。
- 指摘は確度を 0〜100 で採点し、**80 以上を「要対応」**、それ未満を「参考」として分けた。
- `.dev.vars` は読んでいない。

## 結論

実装はドキュメントにほぼ忠実です。要件（FR／受け入れ条件）、データ設計、ルーティング、認証・CSRF、削除条件の原子性はいずれも記述どおりに実装されています。

要対応は 1 件（`prefers-reduced-motion` の扱いが UI_GUIDELINES §3.5 と不一致）です。ほかは文言やドキュメント側の記述の古さで、動作上の欠陥ではありません。

## 要対応（確度 80 以上）

### 1. `prefers-reduced-motion: reduce` で移動・拡大縮小のトランジションが止まらない（確度 85）

- 根拠：UI_GUIDELINES §3.5「`prefers-reduced-motion: reduce` では、すべての移動・拡大縮小を止め、色の変化のみ残す」
- 現状：reduce 時の指定は `animation-duration` と View Transitions の無効化のみで、`transition` は止めていない。次の `transform` のトランジションが reduce 時も動く。
  - スキップリンクの `translateY`（`public/assets/app.css` L213-216）
  - ワードマークの縦罫の `scaleY`（L292-297）
  - ナビゲーションの下線の `scaleX`（L337-342）
- 該当箇所：

https://github.com/issei-fujimoto-accelia/redit_sample/blob/d5cb8c4c1a660bacbc4d3f48a8a483641b8a010d/public/assets/app.css#L182-L191

https://github.com/issei-fujimoto-accelia/redit_sample/blob/d5cb8c4c1a660bacbc4d3f48a8a483641b8a010d/public/assets/app.css#L291-L298

https://github.com/issei-fujimoto-accelia/redit_sample/blob/d5cb8c4c1a660bacbc4d3f48a8a483641b8a010d/public/assets/app.css#L336-L343

- 修正案：reduce のブロックで `transition-property` を色系に限定する（例：`transition-property: color, background-color, border-color !important;`）か、該当 3 か所の `transform` を reduce 時に無効化する。CSS 予算（後述）に余裕が少ないため、短い記述を選ぶ。

## 参考（確度 80 未満）

| # | 確度 | 内容 | 根拠・該当箇所 |
|---|---|---|---|
| 2 | 55 | ホームの空状態の文言「コミュニティを開いて、最初のスレッドを立てましょう。」が、Issue 019 以降の導線（ヘッダーの「投稿する」からスレッド作成）と合っていない。コミュニティページの空状態は「ヘッダーの『投稿する』から」に更新済みで、画面間でも不揃い | REQUIREMENTS §5.1〜5.2、UI_GUIDELINES §4.2。[home.tsx L52-L55](https://github.com/issei-fujimoto-accelia/redit_sample/blob/d5cb8c4c1a660bacbc4d3f48a8a483641b8a010d/src/views/pages/home.tsx#L52-L55) |
| 3 | 45 | CSS が 39,764 バイト（38.8 KB）で、予算 40 KB の約 97%。指摘 1 の修正や今後の追加で超過しやすい | UI_GUIDELINES §8.2。`scripts/design/budget.mjs` は 40×1024 バイトで判定 |
| 4 | 40 | ARCHITECTURE §3 の構成図が実装とずれている：アプリの組み立ては `src/app.tsx`（`index.ts` はエントリのみ）、エラーミドルウェアは `error.tsx`、views の説明が「4画面」（現在は 6 画面＋エラーページ） | ARCHITECTURE §3。ドキュメント側の更新で足りる |
| 5 | 35 | ホームでコミュニティ全件も読む（欄外の索引用）。ARCHITECTURE §4.5 の読み取り見積もり（ホーム：約 20×page＋20 行）に含まれていない。数名利用では無料枠への影響は無視できる | [home.tsx（routes）L10-L15](https://github.com/issei-fujimoto-accelia/redit_sample/blob/d5cb8c4c1a660bacbc4d3f48a8a483641b8a010d/src/routes/home.tsx#L10-L15)。§4.5 に 1 行追記すれば整合する |
| 6 | 30 | `onError` は 403／404／5xx 以外の `HTTPException`（例：不正なリクエストボディで 400）を共通エラーページにせず素のレスポンスで返す。通常のフォーム操作では発生しない | ARCHITECTURE §5.1。[error.tsx L17-L26](https://github.com/issei-fujimoto-accelia/redit_sample/blob/d5cb8c4c1a660bacbc4d3f48a8a483641b8a010d/src/middleware/error.tsx#L17-L26) |

## ドキュメント準拠の確認結果

### REQUIREMENTS

| 項目 | 判定 | 確認内容 |
|---|---|---|
| FR-C-1 Access で識別 | 適合 | ヘッダーなし・検証失敗・メール欠落・ドメイン不一致はすべて 403（`middleware/auth.ts`） |
| FR-C-2 表示名 | 適合 | `@` より前を `lib/display-name.ts` で導出 |
| FR-C-3 JST 表示 | 適合 | `lib/time.ts` で `YYYY-MM-DD HH:mm`、`<time datetime>` は UTC |
| FR-C-4 本人のみ修正・削除 | 適合 | 表示は `OwnerActions`、サーバー側は事前チェック＋ SQL の `author_email = ?` |
| FR-C-5 削除確認・物理削除 | 適合 | `confirm` によるインライン確認、DELETE 文 |
| FR-C-7 未検出 | 適合 | 不正 ID・存在しない ID は 404 の共通エラーページ |
| §6.2 入力制約 | 適合 | trim 後・コードポイント単位で判定。上限値は要件どおり。一意性は `UNIQUE COLLATE NOCASE` |
| FR-CM-1〜4 | 適合 | 名前順一覧、独立した作成ページ、修正、スレッドがあれば 409 で理由表示 |
| FR-T-1〜4 | 適合 | 最終投稿日時 DESC・id DESC、20 件ページング（limit+1 で次ページ判定）、一覧の表示項目 |
| FR-T-5 スレッド作成 | 適合 | `?c=` で初期値、不正・存在しない値は未選択、未選択・存在しない投稿先は 400 |
| FR-T-6〜7 | 適合 | 「編集済み」表示、返信があれば 409、なければ本文ごと削除してコミュニティページへ |
| FR-P-1〜6 | 適合 | 古い順・本文先頭、本文は削除操作を出さず直接リクエストも 409、作成・削除で派生値を更新、修正では変えない |
| §5.2 遷移 | 適合 | 作成後・削除後のリダイレクト先が記述どおり |

### ARCHITECTURE

| 項目 | 判定 | 確認内容 |
|---|---|---|
| §2 構成方針 | 適合 | SSR（Hono＋JSX）、PRG（303）、クライアント JS は `confirm` のみ、編集は `<details>` |
| §3 層の責務 | 適合（記述は要更新） | routes に SQL・権限判定なし、services に HTTP なし。構成図の差分は参考 4 |
| §4.2〜4.3 スキーマ・インデックス | 適合 | `migrations/0001_init.sql` が表のとおり（部分 UNIQUE インデックスを含む） |
| §4.4 更新処理 | 適合 | スレッド作成・返信作成・返信削除（再計算）・スレッド削除（条件付き 2 文）を batch で実行。0 行時の原因判別あり |
| §4.5 読み取り見積もり | 概ね適合 | ホームの追加クエリは参考 5 |
| §5 ルーティング | 適合 | 全ルートとステータス、`/c/new`・`/t/new` の定義順、`POST /c/:id/threads` の廃止、「投稿する」のリンク先 |
| §5.1 エラー応答 | 適合 | 400／409 は元画面の再描画、403／404／500／503 は共通エラーページ（例外は参考 6） |
| §7.2〜7.3 認証 | 適合 | `jose` で署名・期限・`iss`・`aud` を検証、ドメインを再確認、`AUTH_MODE=dev` 以外は fail closed |
| §7.4 CSRF・XSS・SQLi | 適合 | 更新系は `Origin` 一致を必須、`dangerouslySetInnerHTML`・`raw()` の使用なし、プリペアドステートメントのみ |
| §9 設定 | 適合 | `wrangler.jsonc` に `assets`、`workers_dev: true`、`preview_urls: false`。`AUTH_MODE` は含まない |

### UI_GUIDELINES

| 項目 | 判定 | 確認内容 |
|---|---|---|
| §3 トークン | 適合 | 色は `oklch()` のトークンで定義し、ダークは `prefers-color-scheme` で切り替え。コミュニティ色相は黄金角 |
| §3.5 動き | **不適合** | 要対応 1 |
| §4.1 共通レイアウト | 適合 | スキップリンク、`aria-current`、表示名、`PostButton`（モバイルはアイコンのみ＋`aria-label`） |
| §4.2 画面構成 | 適合 | 作成ページ 2 種は独立、返信フォームは見出し・見えるラベルなし、プレースホルダー「会話に参加する」、ボタン「返信する」 |
| §5 共通部品 | 適合 | 部品はデータ取得をせず props で受け取る。`Field` の `hideLabel`、`Select` の未選択肢と `selected` |
| §6.2 JS を使わない動き | 適合 | `@view-transition`、`:target` の強調、`<details>` |
| §7 アクセシビリティ | 適合 | ランドマーク、ラベル、`aria-invalid`／`aria-describedby`、隠しラベル「返信の本文」。ラウンド 15〜18 の axe は 0 件 |
| §8.1〜8.2 実装方針・予算 | 適合（余裕小） | `@layer` の順序、外部リクエストなし、フォント 65.7 KB。CSS は参考 3 |
| §8.3 スタイルガイド | 適合 | `AUTH_MODE=dev` 以外は 404 |
| §9.7 セルフチェック | 適合 | 017・019・021 に対応するラウンド 16〜18 の `review.md` があり、判定は合格 |

## 次の打ち手

1. 指摘 1 を修正し、`npm run design:budget` で CSS 予算内であることを確認する。
2. 参考 2 の文言をコミュニティページの空状態とそろえる（例：「ヘッダーの『投稿する』から、最初のスレッドを立てましょう。」）。
3. 参考 4・5 は ARCHITECTURE の記述更新で対応する（実装の変更は不要）。
