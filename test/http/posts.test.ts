import { describe, expect, it } from "vitest";
import { createClock, createCommunity, createThread, html, reply, setup, unique } from "../helpers";

const alice = "alice@example.com";
const bob = "bob@example.com";

/** スレッドページの投稿 ID を表示順に返す */
const postOrder = (raw: string) => [...raw.matchAll(/id="post-(\d+)"/g)].map((m) => Number(m[1]));

describe("返信の投稿", () => {
  it("返信 → 303 /t/:id#post-:postId、末尾に本文・投稿者の表示名・JST 日時が表示される", async () => {
    const clock = createClock("2026-06-30T15:10:00.000Z");
    const { as } = setup({ clock });
    const cid = await createCommunity(as(alice));
    const tid = await createThread(as(alice), cid);
    clock.advance();
    const body = unique("bob の返信");
    const res = await as(bob).post(`/t/${tid}/posts`, { body });
    expect(res.status).toBe(303);
    expect(res.headers.get("Location")).toMatch(new RegExp(`^/t/${tid}#post-\\d+$`));
    const postId = Number(res.headers.get("Location")!.split("#post-")[1]);

    const page = await html(await as(alice).get(`/t/${tid}`));
    const order = postOrder(page.raw);
    expect(order.at(-1)).toBe(postId);
    expect(page.has(body)).toBe(true);
    expect(page.has("bob")).toBe(true);
    expect(page.has("2026-07-01 00:11")).toBe(true);
  });

  it("3件返信 → 本文が先頭、以降は古い順でネストされない", async () => {
    const clock = createClock("2026-01-01T00:00:00.000Z");
    const { as } = setup({ clock });
    const cid = await createCommunity(as(alice));
    const tid = await createThread(as(alice), cid);
    const replies: number[] = [];
    for (const who of [bob, alice, bob]) {
      clock.advance();
      replies.push(await reply(as(who), tid));
    }
    const page = await html(await as(alice).get(`/t/${tid}`));
    const order = postOrder(page.raw);
    expect(order).toHaveLength(4);
    expect(order.slice(1)).toEqual(replies);
    // 投稿は1つの一覧にフラットに並ぶ（投稿の一覧は1つだけ）
    expect(page.raw.match(/class="post-list"/g)).toHaveLength(1);
  });

  it("返信フォームがスレッドページにある", async () => {
    const { as } = setup();
    const cid = await createCommunity(as(alice));
    const tid = await createThread(as(alice), cid);
    expect((await html(await as(bob).get(`/t/${tid}`))).formActions).toContain(`/t/${tid}/posts`);
  });

  it("本文空 → 400、エラー表示", async () => {
    const { as } = setup();
    const cid = await createCommunity(as(alice));
    const tid = await createThread(as(alice), cid);
    const res = await as(alice).post(`/t/${tid}/posts`, { body: "  \n " });
    expect(res.status).toBe(400);
    expect((await html(res)).has("本文を入力してください。")).toBe(true);
  });

  it("本文 10,001文字 → 400、入力値を保持", async () => {
    const { as } = setup();
    const cid = await createCommunity(as(alice));
    const tid = await createThread(as(alice), cid);
    const res = await as(alice).post(`/t/${tid}/posts`, { body: "あ".repeat(10_001) });
    expect(res.status).toBe(400);
    expect((await html(res)).raw).toContain("あ".repeat(10_001));
  });

  it("存在しないスレッドへの返信 → 404", async () => {
    const { as } = setup();
    expect((await as(alice).post("/t/999999/posts", { body: "x" })).status).toBe(404);
  });
});

/** スレッドページから本文（先頭の投稿）の ID を取り出す */
const openingId = async (client: ReturnType<ReturnType<typeof setup>["as"]>, tid: number) =>
  postOrder((await html(await client.get(`/t/${tid}`))).raw)[0]!;

describe("投稿の修正", () => {
  it("本文の修正 → 303 /t/:id#post-:id、新しい本文と「編集済み」", async () => {
    const { as } = setup();
    const cid = await createCommunity(as(alice));
    const tid = await createThread(as(alice), cid, { body: "直す前の本文" });
    const pid = await openingId(as(alice), tid);
    expect((await html(await as(alice).get(`/t/${tid}`))).has("編集済み")).toBe(false);
    const res = await as(alice).post(`/p/${pid}/edit`, { body: "直した本文" });
    expect(res.status).toBe(303);
    expect(res.headers.get("Location")).toBe(`/t/${tid}#post-${pid}`);
    const page = await html(await as(alice).get(`/t/${tid}`));
    expect(page.has("直した本文")).toBe(true);
    expect(page.has("直す前の本文")).toBe(false);
    expect(page.has("編集済み")).toBe(true);
  });

  it("返信の修正 → 303、新しい本文と「編集済み」", async () => {
    const { as } = setup();
    const cid = await createCommunity(as(alice));
    const tid = await createThread(as(alice), cid);
    const rid = await reply(as(bob), tid, "直す前の返信");
    const res = await as(bob).post(`/p/${rid}/edit`, { body: "直した返信" });
    expect(res.status).toBe(303);
    const page = await html(await as(alice).get(`/t/${tid}`));
    expect(page.has("直した返信")).toBe(true);
    expect(page.has("編集済み")).toBe(true);
  });

  it("修正で本文を空 → 400、元の本文は変わらない", async () => {
    const { as } = setup();
    const cid = await createCommunity(as(alice));
    const tid = await createThread(as(alice), cid);
    const rid = await reply(as(alice), tid, "残る返信");
    const res = await as(alice).post(`/p/${rid}/edit`, { body: "" });
    expect(res.status).toBe(400);
    expect((await html(res)).has("本文を入力してください。")).toBe(true);
    expect((await html(await as(alice).get(`/t/${tid}`))).has("残る返信")).toBe(true);
  });

  it("本人には投稿ごとに修正の操作、返信にだけ削除の操作が表示される", async () => {
    const { as } = setup();
    const cid = await createCommunity(as(alice));
    const tid = await createThread(as(alice), cid);
    const pid = await openingId(as(alice), tid);
    const rid = await reply(as(alice), tid);
    const page = await html(await as(alice).get(`/t/${tid}`));
    expect(page.formActions).toContain(`/p/${pid}/edit`);
    expect(page.formActions).toContain(`/p/${rid}/edit`);
    expect(page.formActions).toContain(`/p/${rid}/delete`);
    expect(page.formActions).not.toContain(`/p/${pid}/delete`);
  });

  it("存在しない投稿の修正・削除 → 404", async () => {
    const { as } = setup();
    expect((await as(alice).post("/p/999999/edit", { body: "x" })).status).toBe(404);
    expect((await as(alice).post("/p/999999/delete")).status).toBe(404);
  });
});

describe("返信の削除", () => {
  it("返信の削除 → 303 /t/:thread_id、一覧から消え、投稿数が戻る", async () => {
    const { as } = setup();
    const cid = await createCommunity(as(alice));
    const tid = await createThread(as(alice), cid);
    const rid = await reply(as(alice), tid, unique("消える返信"));
    const res = await as(alice).post(`/p/${rid}/delete`);
    expect(res.status).toBe(303);
    expect(res.headers.get("Location")).toBe(`/t/${tid}`);
    const page = await html(await as(alice).get(`/t/${tid}`));
    expect(postOrder(page.raw)).not.toContain(rid);
    expect((await html(await as(alice).get(`/c/${cid}`))).text).toMatch(/1 件の投稿/);
  });

  it("本文の削除 POST → 409、本文が残る", async () => {
    const { as } = setup();
    const cid = await createCommunity(as(alice));
    const tid = await createThread(as(alice), cid, { body: "消せない本文" });
    const pid = await openingId(as(alice), tid);
    const res = await as(alice).post(`/p/${pid}/delete`);
    expect(res.status).toBe(409);
    expect((await html(res)).has("本文は単独では削除できません")).toBe(true);
    expect((await html(await as(alice).get(`/t/${tid}`))).has("消せない本文")).toBe(true);
  });
});

describe("日時の表示", () => {
  it("UTC 15:00 に作成した投稿が JST 翌日 00:00 で表示され、datetime 属性は UTC", async () => {
    const clock = createClock("2026-08-31T15:00:00.000Z");
    const { as } = setup({ clock });
    const cid = await createCommunity(as(alice));
    const tid = await createThread(as(alice), cid);
    const page = await html(await as(alice).get(`/t/${tid}`));
    expect(page.has("2026-09-01 00:00")).toBe(true);
    expect(page.raw).toContain('datetime="2026-08-31T15:00:00.000Z"');
  });
});

describe("返信フォーム", () => {
  it("見出し「返信する」と見える「本文」ラベルがなく、プレースホルダー「会話に参加する」と隠したラベルがある", async () => {
    const { as } = setup();
    const cid = await createCommunity(as(alice));
    const tid = await createThread(as(alice), cid);
    const page = await html(await as(alice).get(`/t/${tid}`));
    const form = page.raw.match(new RegExp(`<form[^>]*action="/t/${tid}/posts"[\\s\\S]*?</form>`))![0];
    expect(form).toContain('placeholder="会話に参加する"');
    expect(form).not.toMatch(/<h2/);
    expect(form).toMatch(/<label[^>]*class="visually-hidden"[^>]*>返信の本文<\/label>/);
    expect(form).not.toMatch(/<label[^>]*class="field__label"/);
  });
});
