# README

``` shell
$ cp .dev.vars.example .dev.vars
$ npm install
$ npm run db:migrate:local
$ npm run dev
```


## 開発フロー1(tag v1.0.0)
人の確認が入る点(or 一旦claudeの実行が止まる点)でフローを区切る

- 一次ドキュメントを作成
- 一次ドキュメントをベースにskillでドキュメント群を生成
- issuesを作成
- issuesをまとめて処理
- 人が動作確認して追加でissueを作成
- /code-review によりレビュー `./docs/reports/2026-10-14-code-review.md` を作成

## 開発フロー2

## TODO
docs/をもっと細かくディレクトリ分けた方が良さそう。
D1/: 1次ドキュメント
D2/: 2次ドキュメント(ARCHIECTURE.md, REQUESTS.md, TEST_STRATEGY.md, UI_GUIDELINES.md)
D3/: その後作られるやつ(レビュー結果や途中で作るチェックリストなど)
