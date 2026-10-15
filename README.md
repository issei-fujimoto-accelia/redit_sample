# README

### local
``` shell
$ cp .dev.vars.example .dev.vars
$ npm install
$ npm run db:migrate:local
$ npm run dev
```

### deploy

``` shell
$ npx wrangler d1 create redit-sample
$ npm run db:migrate:remote
$ npm run deploy

# database_id を wrangler.jsoncに設定
# wrangler.jsonc の vars（TEAM_DOMAIN・POLICY_AUD・ALLOWED_EMAIL_DOMAIN）を設定
$ npm run deploy
```

## 目的
人の確認をできるだけ減らして、AIがどんどこ開発を進める仕組みを検討


## 開発フロー1(tag v1.0.0)
人の確認が入る点(or 一旦claudeの実行が止まる点)でフローを区切る

- 一次ドキュメントを作成
- 一次ドキュメントをベースにskillでドキュメント群を生成
- issuesを作成
- issuesをまとめて処理
- 人が動作確認して追加でissueを作成
- /code-review によりレビュー `./docs/reports/2026-10-14-code-review.md` を作成

### 課題
ドキュメントベースで実装を作成した場合、ドキュメントと実装が乖離する可能性がある。
この原因として以下が挙げられる。

1. **一次ドキュメントに識別子がない。** 要件の由来を追えず、CONCEPT のどの記述が実装されていないか（または変えられたか）を機械的に確認できない。
2. **下流から上流へ戻す工程がない。** Requirements での決定、実装中の追加要素が、一次ドキュメントや上位の文書に戻らない。
3. **検証が隣接する文書との比較に限られる。** 局所的な整合の積み重ねでは、CONCEPT との整合を保証できない。
4. **受け入れ条件が REQ と Issue で二重に存在し、REQ 側が使われていない。**
5. **テストに要件 ID がない。** 要件とテストの対応を自動で確かめられない。
6. **変更の影響範囲を列挙に頼っている。** 用語、画面名、ルート、文言を検索して洗い出す手順がない。
7. **作成者と検証者が同じ文脈を共有している。** 同じエージェント（同じ前提）が Issue を書き、実装し、チェックする。


### [一次ドキュメントに識別子がない]について
ドキュメントに識別をつけて、要件、テストまで対応させる。

### [下流から上流へ戻す工程がない]について
OpenSpecをお勧めされた。(初回の構築はSpec Kit、継続的な変更はOpenSpecが向いているらしい)

https://github.com/Fission-AI/OpenSpec

OpenSpecでは、変更単位で仕様を管理する仕様駆動開発のツール。
Claudeなどのcode agentから使う。

現在の仕様をベースに以下のステップで行う
- propose: 提案と差分仕様を作る
- apply: tasksを実装
- verify: 実装が差分使用と合っているか確認
- archive: 差分を正の仕様にマージ

変更の差分を作り、それを元に実装、現仕様と検証、最後に現仕様にマージというステップを行うことで、
ドキュメントと実装の乖離を防ぐ

### [検証が隣接する文書との比較に限られる]について

https://github.com/github/spec-kit
spec・plan・tasks を横断して、網羅性の漏れ、不整合、重複を検出する。ファイルは変更しない。
プロジェクト原則（constitution）に反するものは自動で最重要（CRITICAL）扱いにする


### [変更の影響範囲を列挙に頼っている。]について
ここもOpenSpecをお勧めされた。
OpenSpecでは要件にIDを設定し、そのIDに対してADDED / MODIFIED / REMOVEDの状態を持たせる。
これで影響範囲やテストは機械的に洗い出す


### GitHub Spec Kit
今回の開発フローに近い。仕様駆動開発（Spec-Driven Development）のためのツールキット。

初期化で以下が作られる

``` shell
./memory/constitution.md: 全機能に共通する原則

# 機能ごとにディレクトリが切られる
./specs/xxx/spec.md: ユーザーストーリー、受け入れ基準
./specs/xxx/plan.md: 技術選定と根拠
./specs/xxx/tasks.md: planから作成したタスク
```

#### 基本フロー
- /speckit.constitution: プロジェクトの原則（憲章）を定める
- /speckit.specify: 何を、なぜ作るかを書く。技術スタックは書かない
- /speckit.clarify: 仕様の曖昧な点を質問で解消する
- /speckit.plan: 技術スタックとアーキテクチャを決める
- /speckit.tasks: 実行できるタスクの一覧を作る
- /speckit.analyze: spec、plan、tasks の整合性を検証する（任意、読み取り専用）
- /speckit.implement: タスクに沿って実装する


今回の使ったフローに対して、analyzeの有無が異なるポイント。
analyzeで、タスクのない要件、要件に紐づかないタスクや用語の揺れ、成果物間の矛盾、重複などを検出


## 開発フロー2
- スレッド内のツリーを再現
- コミュニティ一覧でコミュニティを検索
- スレッド一覧でスレッドを検索

## TODO
docs/をもっと細かくディレクトリ分けた方が良さそう。
D1/: 1次ドキュメント
D2/: 2次ドキュメント(ARCHIECTURE.md, REQUESTS.md, TEST_STRATEGY.md, UI_GUIDELINES.md)
D3/: その後作られるやつ(レビュー結果や途中で作るチェックリストなど)
