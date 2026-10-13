import { describe, expect, it } from "vitest";
import { createClock, createCommunity, createThread, html, setup, unique } from "../helpers";

const alice = "alice@example.com";
const bob = "bob@example.com";

/** ページ内のスレッドのリンク（/t/:id）を表示順に返す */
const threadOrder = (links: string[]) => links.filter((l) => /^\/t\/\d+$/.test(l)).map((l) => Number(l.slice(3)));

describe("コミュニティページのスレッド一覧", () => {
  it("そのコミュニティのスレッドだけが表示される", async () => {
    const { as } = setup();
    const c1 = await createCommunity(as(alice));
    const c2 = await createCommunity(as(alice));
    const mine = unique("c1 のスレッド");
    const other = unique("c2 のスレッド");
    await createThread(as(alice), c1, { title: mine });
    await createThread(as(alice), c2, { title: other });
    const page = await html(await as(alice).get(`/c/${c1}`));
    expect(page.has(mine)).toBe(true);
    expect(page.has(other)).toBe(false);
  });

  it("各行にタイトル・作成者・投稿数・最終投稿日時が表示され、コミュニティ名は出ない", async () => {
    const clock = createClock("2026-05-05T14:30:00.000Z");
    const { as } = setup({ clock });
    const name = unique("名前は行に出ない");
    const cid = await createCommunity(as(alice), { name });
    const title = unique("行の表示");
    const tid = await createThread(as(bob), cid, { title });
    const page = await html(await as(alice).get(`/c/${cid}`));
    expect(page.links).toContain(`/t/${tid}`);
    expect(page.has(title)).toBe(true);
    expect(page.has("bob")).toBe(true);
    expect(page.text).toMatch(/1 件の投稿/);
    expect(page.has("2026-05-05 23:30")).toBe(true);
    // コミュニティ名はページ見出しにだけ出て、行のチップ（/c/:id へのリンク）は出ない
    expect(page.links.filter((l) => l === `/c/${cid}`)).toHaveLength(0);
  });

  it("最終投稿日時の新しい順に並ぶ", async () => {
    const clock = createClock("2026-01-01T00:00:00.000Z");
    const { as } = setup({ clock });
    const cid = await createCommunity(as(alice));
    const a = await createThread(as(alice), cid);
    clock.set("2026-01-03T00:00:00.000Z");
    const b = await createThread(as(alice), cid);
    clock.set("2026-01-02T00:00:00.000Z");
    const c = await createThread(as(alice), cid);
    const page = await html(await as(alice).get(`/c/${cid}`));
    expect(threadOrder(page.links)).toEqual([b, c, a]);
  });

  it("同時刻の2件は後に作成したものが上", async () => {
    const clock = createClock("2026-02-01T00:00:00.000Z");
    const { as } = setup({ clock });
    const cid = await createCommunity(as(alice));
    const first = await createThread(as(alice), cid);
    const second = await createThread(as(alice), cid);
    expect(threadOrder((await html(await as(alice).get(`/c/${cid}`))).links)).toEqual([second, first]);
  });

  it("21件 → 1ページ目に20件、?page=2 に1件（最も古いもの）", async () => {
    const clock = createClock("2026-04-01T00:00:00.000Z");
    const { as } = setup({ clock });
    const cid = await createCommunity(as(alice));
    const ids: number[] = [];
    for (let i = 0; i < 21; i++) {
      ids.push(await createThread(as(alice), cid));
      clock.advance();
    }
    const p1 = await html(await as(alice).get(`/c/${cid}`));
    expect(threadOrder(p1.links)).toEqual([...ids].reverse().slice(0, 20));
    expect(p1.links).toContain(`/c/${cid}?page=2`);
    const p2 = await html(await as(alice).get(`/c/${cid}?page=2`));
    expect(threadOrder(p2.links)).toEqual([ids[0]]);
    expect(p2.links).toContain(`/c/${cid}`);
  });

  it("?page=abc / ?page=0 は1ページ目、?page=99 は空の一覧で 200", async () => {
    const { as } = setup();
    const cid = await createCommunity(as(alice));
    const tid = await createThread(as(alice), cid);
    for (const q of ["abc", "0", "-1", "1.5"]) {
      const res = await as(alice).get(`/c/${cid}?page=${q}`);
      expect(res.status).toBe(200);
      expect(threadOrder((await html(res)).links)).toEqual([tid]);
    }
    const res = await as(alice).get(`/c/${cid}?page=99`);
    expect(res.status).toBe(200);
    const page = await html(res);
    expect(threadOrder(page.links)).toEqual([]);
    expect(page.has("このページにスレッドはありません")).toBe(true);
  });
});
