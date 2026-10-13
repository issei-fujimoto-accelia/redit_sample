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
