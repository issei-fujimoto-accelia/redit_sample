import { describe, expect, it } from "vitest";
import { createCommunity, createThread, html, idFrom, setup, unique } from "../helpers";

const alice = "alice@example.com";

describe("コミュニティの作成", () => {
  it("作成すると 303 でコミュニティページへ移動し、名前・説明・作成者の表示名が出る", async () => {
    const { as } = setup();
    const name = unique("設計");
    const res = await as(alice).post("/c", { name, description: "設計について話す場所。" });
    expect(res.status).toBe(303);
    expect(res.headers.get("Location")).toMatch(/^\/c\/\d+$/);

    const page = await html(await as(alice).get(res.headers.get("Location")!));
    expect(page.has(name)).toBe(true);
    expect(page.has("設計について話す場所。")).toBe(true);
    expect(page.has("alice")).toBe(true);
  });

  it("名前の前後の空白は除いて保存する", async () => {
    const { as } = setup();
    const name = unique("空白");
    const id = await createCommunity(as(alice), { name: `  ${name}  ` });
    const page = await html(await as(alice).get(`/c/${id}`));
    expect(page.raw).toContain(`>${name}<`);
  });

  it("名前が空 → 400、入力値とエラーを表示し、保存しない", async () => {
    const { as } = setup();
    const desc = unique("説明だけ");
    const res = await as(alice).post("/c", { name: "   ", description: desc });
    expect(res.status).toBe(400);
    const page = await html(res);
    expect(page.has("コミュニティ名を入力してください。")).toBe(true);
    expect(page.has(desc)).toBe(true);
    expect((await html(await as(alice).get("/c"))).has(desc)).toBe(false);
  });

  it("名前が51文字 → 400", async () => {
    const { as } = setup();
    const res = await as(alice).post("/c", { name: "あ".repeat(51) });
    expect(res.status).toBe(400);
    expect((await html(res)).has("50文字以内")).toBe(true);
  });

  it("説明が501文字 → 400", async () => {
    const { as } = setup();
    const res = await as(alice).post("/c", { name: unique(), description: "あ".repeat(501) });
    expect(res.status).toBe(400);
  });

  it("同名・大小文字違い・前後空白付きの同名 → 409、理由と入力値を表示", async () => {
    const { as } = setup();
    const base = `Design-${unique("x")}`;
    await createCommunity(as(alice), { name: base });
    for (const dup of [base, base.toUpperCase(), ` ${base} `]) {
      const res = await as(alice).post("/c", { name: dup });
      expect(res.status).toBe(409);
      const page = await html(res);
      expect(page.has("同じ名前のコミュニティがすでにあります。")).toBe(true);
      expect(page.raw).toContain(`value="${dup}"`);
    }
  });
});

describe("コミュニティ一覧", () => {
  it("名前順に並ぶ（作成順と異なる順序で作る）", async () => {
    const { as } = setup();
    const tag = unique("order");
    for (const n of ["C", "A", "B"]) await createCommunity(as(alice), { name: `${tag}-${n}` });
    const page = await html(await as(alice).get("/c"));
    const positions = ["A", "B", "C"].map((n) => page.text.indexOf(`${tag}-${n}`));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it("一覧から各コミュニティページへリンクする", async () => {
    const { as } = setup();
    const id = await createCommunity(as(alice));
    expect((await html(await as(alice).get("/c"))).links).toContain(`/c/${id}`);
  });
});

describe("コミュニティページ", () => {
  it("存在しない /c/:id → 404", async () => {
    const { as } = setup();
    const res = await as(alice).get("/c/999999");
    expect(res.status).toBe(404);
    expect((await html(res)).has("見つかりません")).toBe(true);
  });

  it("数値でない /c/:id → 404", async () => {
    const { as } = setup();
    expect((await as(alice).get("/c/abc")).status).toBe(404);
  });

  it("作成直後はスレッドがない旨を表示する", async () => {
    const { as } = setup();
    const id = await createCommunity(as(alice));
    expect((await html(await as(alice).get(`/c/${id}`))).has("スレッドはまだありません")).toBe(true);
  });

  it("idFrom で作成した ID を取得できる", async () => {
    const { as } = setup();
    const res = await as(alice).post("/c", { name: unique() });
    expect(idFrom(res, "c")).toBeGreaterThan(0);
  });
});

describe("コミュニティの修正", () => {
  it("作成者が名前・説明を修正 → 303、ページに新しい名前・説明が出る", async () => {
    const { as } = setup();
    const id = await createCommunity(as(alice), { description: "古い説明" });
    const name = unique("新しい名前");
    const res = await as(alice).post(`/c/${id}/edit`, { name, description: "新しい説明" });
    expect(res.status).toBe(303);
    expect(res.headers.get("Location")).toBe(`/c/${id}`);
    const page = await html(await as(alice).get(`/c/${id}`));
    expect(page.has(name)).toBe(true);
    expect(page.has("新しい説明")).toBe(true);
    expect(page.has("古い説明")).toBe(false);
  });

  it("名前を変えずに説明だけ修正できる（自分自身とは重複しない）", async () => {
    const { as } = setup();
    const name = unique("同じ名前");
    const id = await createCommunity(as(alice), { name });
    const res = await as(alice).post(`/c/${id}/edit`, { name, description: "説明だけ変更" });
    expect(res.status).toBe(303);
  });

  it("修正後の名前が既存と重複（大小文字違い含む）→ 409、内容は変わらない", async () => {
    const { as } = setup();
    const taken = `Taken-${unique("x")}`;
    await createCommunity(as(alice), { name: taken });
    const mine = unique("mine");
    const id = await createCommunity(as(alice), { name: mine });
    for (const dup of [taken, taken.toLowerCase()]) {
      const res = await as(alice).post(`/c/${id}/edit`, { name: dup, description: "" });
      expect(res.status).toBe(409);
      expect((await html(res)).has("同じ名前のコミュニティがすでにあります。")).toBe(true);
    }
    expect((await html(await as(alice).get(`/c/${id}`))).has(mine)).toBe(true);
  });

  it("修正で名前を空 → 400、入力値とエラーを表示", async () => {
    const { as } = setup();
    const id = await createCommunity(as(alice));
    const res = await as(alice).post(`/c/${id}/edit`, { name: "", description: "残す説明" });
    expect(res.status).toBe(400);
    const page = await html(res);
    expect(page.has("コミュニティ名を入力してください。")).toBe(true);
    expect(page.has("残す説明")).toBe(true);
  });

  it("存在しないコミュニティの修正 → 404", async () => {
    const { as } = setup();
    expect((await as(alice).post("/c/999999/edit", { name: unique() })).status).toBe(404);
  });
});

describe("コミュニティの削除", () => {
  it("スレッドのないコミュニティを削除 → 303 /c、一覧から消え、/c/:id が 404", async () => {
    const { as } = setup();
    const name = unique("消す");
    const id = await createCommunity(as(alice), { name });
    const res = await as(alice).post(`/c/${id}/delete`);
    expect(res.status).toBe(303);
    expect(res.headers.get("Location")).toBe("/c");
    expect((await html(await as(alice).get("/c"))).has(name)).toBe(false);
    expect((await as(alice).get(`/c/${id}`)).status).toBe(404);
  });

  it("作成者にはコミュニティページに修正・削除の操作が表示される", async () => {
    const { as } = setup();
    const id = await createCommunity(as(alice));
    const page = await html(await as(alice).get(`/c/${id}`));
    expect(page.formActions).toContain(`/c/${id}/edit`);
    expect(page.formActions).toContain(`/c/${id}/delete`);
  });

  it("存在しないコミュニティの削除 → 404", async () => {
    const { as } = setup();
    expect((await as(alice).post("/c/999999/delete")).status).toBe(404);
  });
});

describe("コミュニティの削除（スレッドあり）", () => {
  it("スレッドがあるコミュニティの削除 → 409、理由の表示、コミュニティとスレッドが残る", async () => {
    const { as } = setup();
    const cid = await createCommunity(as(alice));
    const title = unique("残るスレッド");
    const tid = await createThread(as(alice), cid, { title });
    const res = await as(alice).post(`/c/${cid}/delete`);
    expect(res.status).toBe(409);
    expect((await html(res)).has("スレッドが残っているコミュニティは削除できません。")).toBe(true);
    expect((await html(await as(alice).get(`/c/${cid}`))).has(title)).toBe(true);
    expect((await as(alice).get(`/t/${tid}`)).status).toBe(200);
  });

  it("スレッドを削除した後は、コミュニティを削除できる", async () => {
    const { as } = setup();
    const cid = await createCommunity(as(alice));
    const tid = await createThread(as(alice), cid);
    await as(alice).post(`/t/${tid}/delete`);
    expect((await as(alice).post(`/c/${cid}/delete`)).status).toBe(303);
  });
});

describe("コミュニティ作成ページ", () => {
  it("一覧に作成ページへのリンクがあり、一覧には作成フォームがない", async () => {
    const { as } = setup();
    const page = await html(await as(alice).get("/c"));
    expect(page.links).toContain("/c/new");
    expect(page.formActions).not.toContain("/c");
  });

  it("GET /c/new → 200、名前・説明の入力欄と /c へ送るフォームがある", async () => {
    const { as } = setup();
    const res = await as(alice).get("/c/new");
    expect(res.status).toBe(200);
    const page = await html(res);
    expect(page.formActions).toContain("/c");
    expect(page.raw).toMatch(/name="name"/);
    expect(page.raw).toMatch(/name="description"/);
    expect(page.has("コミュニティを作る")).toBe(true);
  });

  it("400 は作成ページ（一覧ではない）を入力値とエラー付きで再描画する", async () => {
    const { as } = setup();
    const existing = unique("一覧にだけ出る");
    await createCommunity(as(alice), { name: existing });
    const res = await as(alice).post("/c", { name: "", description: "残る説明" });
    expect(res.status).toBe(400);
    const page = await html(res);
    expect(page.formActions).toContain("/c");
    expect(page.has("残る説明")).toBe(true);
    expect(page.has(existing)).toBe(false);
  });

  it("409 は作成ページで理由を表示する", async () => {
    const { as } = setup();
    const name = unique("重複");
    await createCommunity(as(alice), { name });
    const res = await as(alice).post("/c", { name });
    expect(res.status).toBe(409);
    const page = await html(res);
    expect(page.formActions).toContain("/c");
    expect(page.has("同じ名前のコミュニティがすでにあります。")).toBe(true);
  });
});
