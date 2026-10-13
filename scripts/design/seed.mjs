// 画面確認用のデータを HTTP 経由で投入する：npm run design:seed
// AUTH_MODE=dev で起動したサーバーに対して実行する。各 Issue で画面を追加したら投入するデータを足す。
// 何度実行してもよい（同名のコミュニティは 409 になり、作成済みとして扱う）。
import { BASE_URL } from "./config.mjs";

const headers = { Origin: new URL(BASE_URL).origin, "Content-Type": "application/x-www-form-urlencoded" };

/** フォーム POST。303 の Location を返す */
export async function post(path, form) {
  const res = await fetch(BASE_URL + path, { method: "POST", headers, body: new URLSearchParams(form), redirect: "manual" });
  if (res.status !== 303) return { status: res.status, location: null };
  return { status: 303, location: res.headers.get("Location") };
}

const idOf = (loc) => Number(loc?.match(/\/(\d+)/)?.[1]);

export const COMMUNITIES = [
  { name: "設計とアーキテクチャ", description: "システム設計、データモデル、技術判断の記録について話す場所。" },
  { name: "Cloudflare Workers", description: "Workers、D1、Access の使い方とハマりどころ。" },
  { name: "雑談", description: "" },
  { name: "読書会", description: "月に一冊、技術書を読んで感想を書きます。\n今月は『データ指向アプリケーションデザイン』。" },
  { name: "Typography", description: "和欧混植、約物、行間の話。" },
  {
    name: "五十字のコミュニティ名を確認するための長い名前の例です。表示が崩れないかを見ます。あいうえおかきく",
    description: "説明が長い場合の表示。".repeat(40),
  },
];

const ids = {};
for (const c of COMMUNITIES) {
  const r = await post("/c", c);
  if (r.status === 303) ids[c.name] = idOf(r.location);
  console.log(`community ${r.status} ${c.name.slice(0, 20)}`);
}
console.log(JSON.stringify(ids));
