---
created_at: 2026-10-13
status: done
---

# 004b UI 基盤とデザインシステム

元計画：[IMPLEMENTATION_PLAN.md W4b](../docs/IMPLEMENTATION_PLAN.md#w4b-ui-基盤とデザインシステム)
基準：[UI_GUIDELINES.md](../docs/UI_GUIDELINES.md)

## Background

005 以降で各画面を作る前に、見た目の方針・デザイントークン・共通部品をそろえる。これがないと各 Issue が場当たり的なマークアップを作り、014 でまとめて直すことになる。特にスレッド一覧の行は 008（コミュニティページ）と 013（ホーム）の両方で使う。

品質目標は Awwwards、Webby Awards、FWA で賞を獲れる水準とし、UI_GUIDELINES §9 のセルフチェックを合格まで繰り返す。

## Dependencies

- 004（Layout とエラーページの骨格）

## Scope

- **未決事項の決定（ユーザーと相談）**：アプリ名とワードマーク、欧文・数字の書体（UI_GUIDELINES §11）
- **アセット配信**：`wrangler.jsonc` に `assets.directory` を追加し、CSS とフォントを Workers Static Assets で配信する
- **CSS**：`@layer` 構成、デザイントークン（色・書体・文字サイズ・余白・動き、ライト／ダーク）、reset、base、layout
- **共通部品**：UI_GUIDELINES §5 の部品を `src/views/components/` に実装する（データ取得はしない）
- **Layout の仕上げ**：SiteHeader（ワードマーク、現在地、表示名）、SiteFooter、スキップリンク、View Transitions
- **エラーページの仕上げ**：403／404／500／503
- **`lib/community-hue.ts`**：`communityHue(id)`（コミュニティ ID → 0〜359 の色相）
- **スタイルガイドページ**：`GET /_styleguide`（`AUTH_MODE=dev` のときだけ有効）。全部品と UI_GUIDELINES §6.3 の状態を固定データで表示する
- **デザイン確認ツール**：`scripts/design/` に `seed`・`capture`・`audit`（Playwright、`@axe-core/playwright`）と npm スクリプト `design:seed`・`design:capture`・`design:audit`
- **セルフチェックループ**：スタイルガイドページとエラーページを対象に、UI_GUIDELINES §9 の手順で合格まで繰り返す
- `design/rounds/` の PNG を `.gitignore` に追加する

## Out of scope

- 各画面（ホーム、コミュニティ一覧・ページ、スレッドページ）への部品の組み込み（005〜013）
- `design:seed` が投入する画面用データのうち、まだ存在しない機能のもの（各 Issue で拡張する）
- クライアント JS の追加

## Implementation notes

- 部品は props だけで描画できるようにし、スタイルガイドページでは固定データを渡す。
- テストは CSS クラスや DOM の細部に依存させない（TEST_STRATEGY §3.3）。
- 和文 Web フォントは読み込まない。欧文・数字の書体は自前ホストの woff2 を1書体のみ。
- 予算（UI_GUIDELINES §8.2）を守る。超える場合は理由を `review.md` に書き、ユーザーに相談する。
- コミュニティ色相は、どの値でもコントラスト基準（UI_GUIDELINES §7）を満たすよう、明度・彩度をトークンで固定する。
- 1セッションに収まらない場合は、「トークン・Layout・エラーページ」と「部品・スタイルガイド」の2ステップに分けてよい。
- トークンの値を調整した場合は、UI_GUIDELINES §3 を更新する。

## Acceptance criteria

- [x] アプリ名・ワードマーク・欧文書体が決まり、UI_GUIDELINES §11 が更新されている
- [x] UI_GUIDELINES §5 の全部品がスタイルガイドページに表示される
- [x] UI_GUIDELINES §6.3 の状態がスタイルガイドページで確認できる
- [x] ライト／ダーク、390px／1440px で崩れない
- [x] `/_styleguide` は `AUTH_MODE=dev` 以外では 404
- [x] `npm run design:audit` で axe の違反が0件
- [x] UI_GUIDELINES §8.2 の予算内
- [x] セルフチェックで全評価軸が8点以上（`design/rounds/NN/review.md` に記録）。5ラウンドで未達の場合は、未達の内容を記録してユーザーに判断を仰いでいる
- [x] ユーザーがスタイルガイドページをレビューし、承認している
- [x] 共通 DoD

## Tests

### S2：`test/lib/community-hue.test.ts`

- 同じ ID には常に同じ色相を返す
- 戻り値が 0 以上 359 以下の整数
- 隣り合う ID（1, 2, 3）が近い色相にならない（具体的な期待値を固定値で書く）

### S1：`test/http/styleguide.test.ts`

- `AUTH_MODE` が `dev` 以外のとき、`GET /_styleguide` → 404
- `AUTH_MODE=dev` のとき、`GET /_styleguide` → 200

### S1：既存テストの回帰確認

- Layout とエラーページの変更後も、001〜004 のテストが全件成功する

## 実装メモ

- アプリ名 **Marginalia**、欧文書体 **Fraunces**（ユーザー決定）。UI_GUIDELINES §2.2・§3・§11 を更新した。
- 部品：`src/views/components/`（site / community / thread / post / form / common）。`Layout` は `components/site.tsx` に移した。
- スタイルガイド：`GET /_styleguide`、エラーページ見本 `GET /_styleguide/error/:status`（どちらも `AUTH_MODE=dev` のみ）。
- 状態の見本はスタイルガイド専用のクラス（`.is-hover`・`.is-focus` など）で強制表示している。
- デザイン確認：`npm run design:capture` / `design:audit` / `design:budget`（`design:seed` は画面ができ次第データを追加する）。`CHROMIUM_PATH` で実行ファイルを指定可能。
- セルフチェック：Round 01〜05（`design/rounds/*/review.md`）。Round 03・05 で独立エージェントの採点を実施。最終は自己採点で全軸8点以上、axe 0 件、CSS 32.9KB／Font 65.7KB。5ラウンドに達したため、ユーザーの判断を仰ぎ承認を得た。
