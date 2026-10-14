import { describe, expect, it } from "vitest";
import { createClock, createCommunity, createThread, html, reply, setup, unique } from "../helpers";

const bob = "bob@example.com";

const alice = "alice@example.com";

describe("スレッドの作成", () => {
  it("作成 → 303 /t/:id、タイトル・本文・作成者の表示名・JST 日時が表示される", async () => {
    const clock = createClock("2026-03-01T03:04:00.000Z");
    const { as } = setup({ clock });
    const cid = await createCommunity(as(alice));
    const title = unique("初めてのスレッド");
    const res = await as(alice).post("/t", { community_id: String(cid), title, body: "最初の投稿です。\n2行目。" });
    expect(res.status).toBe(303);
    expect(res.headers.get("Location")).toMatch(/^\/t\/\d+$/);

    const page = await html(await as(alice).get(res.headers.get("Location")!));
    expect(page.has(title)).toBe(true);
    expect(page.raw).toContain("最初の投稿です。\n2行目。");
    expect(page.has("alice")).toBe(true);
    expect(page.has("2026-03-01 12:04")).toBe(true);
    expect(page.links).toContain(`/c/${cid}`);
  });

  it("選んだコミュニティのスレッドとして一覧に出る", async () => {
    const { as } = setup();
    const c1 = await createCommunity(as(alice));
    const c2 = await createCommunity(as(alice));
    const title = unique("c2 に投稿");
    await createThread(as(alice), c2, { title });
    expect((await html(await as(alice).get(`/c/${c2}`))).has(title)).toBe(true);
    expect((await html(await as(alice).get(`/c/${c1}`))).has(title)).toBe(false);
  });

  it("コミュニティページにスレッド作成フォームがない", async () => {
    const { as } = setup();
    const cid = await createCommunity(as(alice));
    const page = await html(await as(alice).get(`/c/${cid}`));
    expect(page.formActions).not.toContain("/t");
    expect(page.formActions.some((a) => a.endsWith("/threads"))).toBe(false);
  });

  it("タイトル空 → 400、入力値と選択値を保持して作成ページを再描画", async () => {
    const { as } = setup();
    const cid = await createCommunity(as(alice));
    const body = unique("残る本文");
    const res = await as(alice).post("/t", { community_id: String(cid), title: "  ", body });
    expect(res.status).toBe(400);
    const page = await html(res);
    expect(page.formActions).toContain("/t");
    expect(page.has("タイトルを入力してください。")).toBe(true);
    expect(page.has(body)).toBe(true);
    expect(page.raw).toMatch(new RegExp(`<option[^>]*value="${cid}"[^>]*selected`));
  });

  it("タイトル 201文字 → 400", async () => {
    const { as } = setup();
    const cid = await createCommunity(as(alice));
    const res = await as(alice).post("/t", { community_id: String(cid), title: "あ".repeat(201), body: "本文" });
    expect(res.status).toBe(400);
  });

  it("本文 10,001文字 → 400", async () => {
    const { as } = setup();
    const cid = await createCommunity(as(alice));
    const res = await as(alice).post("/t", { community_id: String(cid), title: "タイトル", body: "あ".repeat(10_001) });
    expect(res.status).toBe(400);
    expect((await html(res)).has("10,000文字以内")).toBe(true);
  });

  it("コミュニティ未選択・存在しないコミュニティ → 400、入力値を保持", async () => {
    const { as } = setup();
    for (const community_id of ["", "999999", "abc"]) {
      const title = unique("残るタイトル");
      const res = await as(alice).post("/t", { community_id, title, body: "本文" });
      expect(res.status).toBe(400);
      const page = await html(res);
      expect(page.has("投稿先のコミュニティを選んでください。")).toBe(true);
      expect(page.raw).toContain(`value="${title}"`);
    }
  });
});

describe("スレッド作成ページと投稿ボタン", () => {
  it("全画面のヘッダーに作成ページへのリンクがある", async () => {
    const { as } = setup();
    const cid = await createCommunity(as(alice));
    const tid = await createThread(as(alice), cid);
    for (const path of ["/", "/c", "/c/new", `/c/${cid}`, `/t/${tid}`, "/t/new"]) {
      const page = await html(await as(alice).get(path));
      expect(page.links.some((l) => l === "/t/new" || l.startsWith("/t/new?"))).toBe(true);
    }
  });

  it("コミュニティページ・スレッドページの投稿ボタンには、そのコミュニティの初期値が付く。ホームでは付かない", async () => {
    const { as } = setup();
    const cid = await createCommunity(as(alice));
    const tid = await createThread(as(alice), cid);
    expect((await html(await as(alice).get(`/c/${cid}`))).links).toContain(`/t/new?c=${cid}`);
    expect((await html(await as(alice).get(`/t/${tid}`))).links).toContain(`/t/new?c=${cid}`);
    const home = await html(await as(alice).get("/"));
    expect(home.links).toContain("/t/new");
    expect(home.links.some((l) => l.startsWith("/t/new?"))).toBe(false);
  });

  it("GET /t/new?c=:id → 200、そのコミュニティが選択済み", async () => {
    const { as } = setup();
    const name = unique("初期値");
    const cid = await createCommunity(as(alice), { name });
    const res = await as(alice).get(`/t/new?c=${cid}`);
    expect(res.status).toBe(200);
    const page = await html(res);
    expect(page.formActions).toContain("/t");
    expect(page.raw).toMatch(new RegExp(`<option[^>]*value="${cid}"[^>]*selected`));
  });

  it("?c= が不正・存在しない → 200、未選択", async () => {
    const { as } = setup();
    await createCommunity(as(alice));
    for (const q of ["?c=abc", "?c=999999", ""]) {
      const res = await as(alice).get(`/t/new${q}`);
      expect(res.status).toBe(200);
      expect((await html(res)).raw).not.toMatch(/<option[^>]*value="\d+"[^>]*selected/);
    }
  });
});

describe("スレッドページ", () => {
  it("存在しない /t/:id → 404", async () => {
    const { as } = setup();
    const res = await as(alice).get("/t/999999");
    expect(res.status).toBe(404);
    expect((await html(res)).has("見つかりません")).toBe(true);
  });

  it("本文が先頭の投稿として表示される", async () => {
    const { as } = setup();
    const cid = await createCommunity(as(alice));
    const tid = await createThread(as(alice), cid, { body: "本文の中身" });
    const page = await html(await as(alice).get(`/t/${tid}`));
    expect(page.has("本文の中身")).toBe(true);
    expect(page.raw).toMatch(/id="post-\d+"/);
  });
});

describe("スレッドの修正", () => {
  it("作成直後は「編集済み」が出ない。タイトル修正 → 303、新しいタイトルと「編集済み」", async () => {
    const { as } = setup();
    const cid = await createCommunity(as(alice));
    const tid = await createThread(as(alice), cid);
    expect((await html(await as(alice).get(`/t/${tid}`))).has("編集済み")).toBe(false);

    const title = unique("直したタイトル");
    const res = await as(alice).post(`/t/${tid}/edit`, { title });
    expect(res.status).toBe(303);
    expect(res.headers.get("Location")).toBe(`/t/${tid}`);
    const page = await html(await as(alice).get(`/t/${tid}`));
    expect(page.has(title)).toBe(true);
    expect(page.has("編集済み")).toBe(true);
  });

  it("タイトルを空に修正 → 400、元のタイトルは変わらない", async () => {
    const { as } = setup();
    const cid = await createCommunity(as(alice));
    const title = unique("元のタイトル");
    const tid = await createThread(as(alice), cid, { title });
    const res = await as(alice).post(`/t/${tid}/edit`, { title: " " });
    expect(res.status).toBe(400);
    expect((await html(res)).has("タイトルを入力してください。")).toBe(true);
    expect((await html(await as(alice).get(`/t/${tid}`))).has(title)).toBe(true);
  });

  it("作成者にはスレッドの修正・削除の操作が表示される", async () => {
    const { as } = setup();
    const cid = await createCommunity(as(alice));
    const tid = await createThread(as(alice), cid);
    const page = await html(await as(alice).get(`/t/${tid}`));
    expect(page.formActions).toContain(`/t/${tid}/edit`);
    expect(page.formActions).toContain(`/t/${tid}/delete`);
  });

  it("存在しないスレッドの修正・削除 → 404", async () => {
    const { as } = setup();
    expect((await as(alice).post("/t/999999/edit", { title: "x" })).status).toBe(404);
    expect((await as(alice).post("/t/999999/delete")).status).toBe(404);
  });
});

describe("スレッドの削除", () => {
  it("返信なしのスレッドを削除 → 303 /c/:community_id、/t/:id が 404、一覧から消える", async () => {
    const { as } = setup();
    const cid = await createCommunity(as(alice));
    const title = unique("消すスレッド");
    const tid = await createThread(as(alice), cid, { title });
    const res = await as(alice).post(`/t/${tid}/delete`);
    expect(res.status).toBe(303);
    expect(res.headers.get("Location")).toBe(`/c/${cid}`);
    expect((await as(alice).get(`/t/${tid}`)).status).toBe(404);
    expect((await html(await as(alice).get(`/c/${cid}`))).has(title)).toBe(false);
  });
});

describe("スレッドの削除（返信あり）", () => {
  it("返信ありのスレッド削除 → 409、理由の表示、スレッドと全投稿が残る", async () => {
    const { as } = setup();
    const cid = await createCommunity(as(alice));
    const tid = await createThread(as(alice), cid, { body: "残る本文" });
    await reply(as(bob), tid, "残る返信");
    const res = await as(alice).post(`/t/${tid}/delete`);
    expect(res.status).toBe(409);
    expect((await html(res)).has("返信が残っているスレッドは削除できません。")).toBe(true);
    const page = await html(await as(alice).get(`/t/${tid}`));
    expect(page.has("残る本文")).toBe(true);
    expect(page.has("残る返信")).toBe(true);
  });

  it("返信を削除した後は、スレッドを削除できる", async () => {
    const { as } = setup();
    const cid = await createCommunity(as(alice));
    const tid = await createThread(as(alice), cid);
    const rid = await reply(as(alice), tid);
    expect((await as(alice).post(`/t/${tid}/delete`)).status).toBe(409);
    await as(alice).post(`/p/${rid}/delete`);
    const res = await as(alice).post(`/t/${tid}/delete`);
    expect(res.status).toBe(303);
    expect(res.headers.get("Location")).toBe(`/c/${cid}`);
    expect((await as(alice).get(`/t/${tid}`)).status).toBe(404);
  });
});
