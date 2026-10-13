import { describe, expect, it } from "vitest";
import { createClock, createCommunity, createThread, html, reply, setup, unique } from "../helpers";

/**
 * ホームは全体の件数・並び順に依存するため、このファイルに分ける（TEST_STRATEGY §3.1）。
 * 同じファイルのテストは DB を共有するので、各テストは自分のデータが先頭に来るよう、より新しい時刻を使う。
 */

const alice = "alice@example.com";
const bob = "bob@example.com";

const threadOrder = (links: string[]) => links.filter((l) => /^\/t\/\d+$/.test(l)).map((l) => Number(l.slice(3)));

describe("ホームの横断スレッド一覧", () => {
  it("2つのコミュニティのスレッドが両方表示され、各行に正しいコミュニティ名が出る", async () => {
    const clock = createClock("2030-01-01T00:00:00.000Z");
    const { as } = setup({ clock });
    const n1 = unique("コミュニティA");
    const n2 = unique("コミュニティB");
    const c1 = await createCommunity(as(alice), { name: n1 });
    const c2 = await createCommunity(as(alice), { name: n2 });
    const t1 = await createThread(as(alice), c1, { title: unique("A のスレッド") });
    clock.advance();
    const t2 = await createThread(as(bob), c2, { title: unique("B のスレッド") });

    const res = await as(alice).get("/");
    expect(res.status).toBe(200);
    const page = await html(res);
    expect(threadOrder(page.links).slice(0, 2)).toEqual([t2, t1]);
    // 行の中のコミュニティ名（チップ）が、その行のスレッドのリンクの直前に出る
    const i2 = page.raw.indexOf(`href="/t/${t2}"`);
    const i1 = page.raw.indexOf(`href="/t/${t1}"`);
    expect(page.raw.lastIndexOf(`href="/c/${c2}"`, i2)).toBeGreaterThan(-1);
    expect(page.raw.slice(page.raw.lastIndexOf(`href="/c/${c2}"`, i2), i2)).toContain(n2);
    expect(page.raw.slice(page.raw.lastIndexOf(`href="/c/${c1}"`, i1), i1)).toContain(n1);
  });

  it("新しい順に並び、最も古いスレッドに返信すると先頭へ。その返信を削除すると元の順に戻る", async () => {
    const clock = createClock("2031-01-01T00:00:00.000Z");
    const { as } = setup({ clock });
    const cid = await createCommunity(as(alice));
    const a = await createThread(as(alice), cid);
    clock.set("2031-01-03T00:00:00.000Z");
    const b = await createThread(as(alice), cid);
    clock.set("2031-01-02T00:00:00.000Z");
    const c = await createThread(as(alice), cid);
    const top3 = async () => threadOrder((await html(await as(alice).get("/"))).links).slice(0, 3);
    expect(await top3()).toEqual([b, c, a]);

    clock.set("2031-01-04T00:00:00.000Z");
    const rid = await reply(as(bob), a);
    expect(await top3()).toEqual([a, b, c]);

    await as(bob).post(`/p/${rid}/delete`);
    expect(await top3()).toEqual([b, c, a]);
  });

  it("投稿を修正しても順序が変わらない", async () => {
    const clock = createClock("2032-01-01T00:00:00.000Z");
    const { as } = setup({ clock });
    const cid = await createCommunity(as(alice));
    const a = await createThread(as(alice), cid);
    const rid = await reply(as(alice), a);
    clock.set("2032-01-02T00:00:00.000Z");
    const b = await createThread(as(alice), cid);
    clock.set("2032-01-03T00:00:00.000Z");
    await as(alice).post(`/p/${rid}/edit`, { body: "修正した返信" });
    await as(alice).post(`/t/${a}/edit`, { title: unique("修正したタイトル") });
    expect(threadOrder((await html(await as(alice).get("/"))).links).slice(0, 2)).toEqual([b, a]);
  });

  it("21件 → 1ページ目20件、2ページ目の先頭は21件のうち最も古いもの", async () => {
    const clock = createClock("2033-01-01T00:00:00.000Z");
    const { as } = setup({ clock });
    const cid = await createCommunity(as(alice));
    const ids: number[] = [];
    for (let i = 0; i < 21; i++) {
      ids.push(await createThread(as(alice), cid));
      clock.advance();
    }
    const p1 = await html(await as(alice).get("/"));
    expect(threadOrder(p1.links)).toEqual([...ids].reverse().slice(0, 20));
    expect(p1.links).toContain("/?page=2");
    const p2 = await html(await as(alice).get("/?page=2"));
    expect(threadOrder(p2.links)[0]).toBe(ids[0]);
    expect(p2.links).toContain("/");
  });

  it("範囲外のページは空の一覧で 200", async () => {
    const { as } = setup();
    const res = await as(alice).get("/?page=9999");
    expect(res.status).toBe(200);
    expect(threadOrder((await html(res)).links)).toEqual([]);
  });
});
