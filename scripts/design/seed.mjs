// 画面確認用のデータを HTTP 経由で投入する：npm run design:seed
// AUTH_MODE=dev で起動したサーバーに対して実行する。各 Issue で画面を追加したら投入するデータを足す。
import { BASE_URL } from "./config.mjs";

const steps = [];

if (steps.length === 0) {
  console.log("投入するデータはまだありません（スタイルガイドは固定データで表示します）。");
}
for (const step of steps) await step(BASE_URL);
