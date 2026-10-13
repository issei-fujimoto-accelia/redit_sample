// 画面確認用のデータを HTTP 経由で投入する：npm run design:seed
// AUTH_MODE=dev で起動したサーバーに対して実行する。各 Issue で画面を追加したら投入するデータを足す。
// 空の DB に対して実行する（ローカル D1 を作り直す：rm -rf .wrangler/state && npm run db:migrate:local）。
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

const LONG_TITLE =
  "長いタイトルの表示確認：スレッド一覧で二百文字近いタイトルがどのように折り返され、投稿数や最終投稿日時の列と干渉せずに読めるかを確かめるための文章です。".repeat(2) +
  "最後まで崩れずに表示されることを確認します。";

const THREADS = [
  { c: "設計とアーキテクチャ", title: "D1 のインデックス設計で迷っていること", body: "スレッド一覧を最終投稿順で並べたい。\n`threads(last_posted_at DESC, id DESC)` で足りるか、意見を聞きたいです。", replies: 6 },
  { c: "Cloudflare Workers", title: "wrangler dev で Access をどう再現するか", body: "ローカルには Access がないので、JWT が届きません。\nみなさんどうしていますか？", replies: 3 },
  { c: "読書会", title: "今月の一冊：データ指向アプリケーションデザイン", body: "第1章の感想を書きましょう。", replies: 2 },
  { c: "Typography", title: "和欧混植の約物の詰め", body: "text-spacing-trim を試した人はいますか？", replies: 0 },
  { c: "設計とアーキテクチャ", title: LONG_TITLE, body: "長いタイトルのスレッド。", replies: 1 },
  { c: "雑談", title: "<script>alert('XSS')</script> はそのまま表示される？", body: "<b>太字</b> にならず、文字列として表示されるはず。\n\n\n空行も保持される。", replies: 0 },
  { c: "設計とアーキテクチャ", title: "派生値を threads に持つ設計（ADR-3）", body: "post_count と last_posted_at を持たせる判断について。", replies: 0 },
];

const threadIds = {};
for (const t of THREADS) {
  const cid = ids[t.c];
  if (!cid) continue;
  const r = await post(`/c/${cid}/threads`, { title: t.title, body: t.body });
  const tid = idOf(r.location);
  threadIds[t.title.slice(0, 12)] = tid;
  for (let i = 0; i < t.replies; i++) {
    const body = i === 1 ? "https://example.com/" + "averyverylongpathsegmentwithoutanybreak".repeat(4) : `返信 ${i + 1}。なるほど、その観点はありませんでした。`;
    await post(`/t/${tid}/posts`, { body });
  }
  console.log(`thread ${r.status} ${t.title.slice(0, 20)} (+${t.replies})`);
}
// コミュニティページのページング確認用（21件）
const paging = ids["雑談"];
if (paging) for (let i = 1; i <= 21; i++) await post(`/c/${paging}/threads`, { title: `ページング確認用のスレッド ${i}`, body: "本文" });
console.log(JSON.stringify(threadIds));
