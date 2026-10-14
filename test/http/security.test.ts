import { describe, expect, it } from "vitest";
import { createCommunity, createThread, html, setup, tokenFor, unique } from "../helpers";

describe("Origin 検証（CSRF）", () => {
  const post = async (origin?: string, path = "/no-such-path") => {
    const s = setup();
    const headers = new Headers({ "Cf-Access-Jwt-Assertion": await tokenFor("alice@example.com", s.clock) });
    if (origin) headers.set("Origin", origin);
    return s.request(path, { method: "POST", headers, body: new URLSearchParams({ name: "x" }) });
  };

  it("Origin が自ホストでない POST → 403", async () => {
    expect((await post("https://evil.example")).status).toBe(403);
  });

  it("他オリジンからのコミュニティ作成 POST → 403", async () => {
    expect((await post("https://evil.example", "/c")).status).toBe(403);
  });

  it("Origin なしの POST → 403", async () => {
    expect((await post()).status).toBe(403);
  });

  it("Origin が自ホストの POST は Origin 検証を通過する（未定義パスなので 404）", async () => {
    expect((await post("http://localhost")).status).toBe(404);
  });
});

describe("他人のコミュニティ", () => {
  const alice = "alice@example.com";
  const bob = "bob@example.com";

  it("他人には修正・削除の操作が表示されない", async () => {
    const { as } = setup();
    const id = await createCommunity(as(alice));
    const page = await html(await as(bob).get(`/c/${id}`));
    expect(page.formActions).not.toContain(`/c/${id}/edit`);
    expect(page.formActions).not.toContain(`/c/${id}/delete`);
  });

  it("他人の修正 POST → 403、内容は変わらない", async () => {
    const { as } = setup();
    const name = unique("alice のもの");
    const id = await createCommunity(as(alice), { name, description: "元の説明" });
    const res = await as(bob).post(`/c/${id}/edit`, { name: unique("乗っ取り"), description: "書き換え" });
    expect(res.status).toBe(403);
    const page = await html(await as(alice).get(`/c/${id}`));
    expect(page.has(name)).toBe(true);
    expect(page.has("元の説明")).toBe(true);
  });

  it("他人の削除 POST → 403、コミュニティは残る", async () => {
    const { as } = setup();
    const id = await createCommunity(as(alice));
    expect((await as(bob).post(`/c/${id}/delete`)).status).toBe(403);
    expect((await as(alice).get(`/c/${id}`)).status).toBe(200);
  });
});

describe("他人のスレッド", () => {
  const alice = "alice@example.com";
  const bob = "bob@example.com";

  it("他人にはスレッドの修正・削除の操作が表示されない", async () => {
    const { as } = setup();
    const cid = await createCommunity(as(alice));
    const tid = await createThread(as(alice), cid);
    const page = await html(await as(bob).get(`/t/${tid}`));
    expect(page.formActions).not.toContain(`/t/${tid}/edit`);
    expect(page.formActions).not.toContain(`/t/${tid}/delete`);
  });

  it("他人のスレッドの修正・削除 POST → 403、内容が変わらない", async () => {
    const { as } = setup();
    const cid = await createCommunity(as(alice));
    const title = unique("alice のスレッド");
    const tid = await createThread(as(alice), cid, { title });
    expect((await as(bob).post(`/t/${tid}/edit`, { title: "乗っ取り" })).status).toBe(403);
    expect((await as(bob).post(`/t/${tid}/delete`)).status).toBe(403);
    const page = await html(await as(alice).get(`/t/${tid}`));
    expect(page.has(title)).toBe(true);
    expect(page.has("編集済み")).toBe(false);
  });
});

describe("他人の投稿", () => {
  const alice = "alice@example.com";
  const bob = "bob@example.com";

  it("他人の投稿には操作が表示されず、修正・削除 POST → 403、内容が変わらない", async () => {
    const { as } = setup();
    const cid = await createCommunity(as(alice));
    const tid = await createThread(as(alice), cid);
    const res = await as(alice).post(`/t/${tid}/posts`, { body: "alice の返信" });
    const rid = Number(res.headers.get("Location")!.split("#post-")[1]);
    const page = await html(await as(bob).get(`/t/${tid}`));
    expect(page.formActions.some((a) => a.startsWith("/p/"))).toBe(false);
    expect((await as(bob).post(`/p/${rid}/edit`, { body: "書き換え" })).status).toBe(403);
    expect((await as(bob).post(`/p/${rid}/delete`)).status).toBe(403);
    const after = await html(await as(alice).get(`/t/${tid}`));
    expect(after.has("alice の返信")).toBe(true);
    expect(after.has("編集済み")).toBe(false);
  });
});

describe("XSS（プレーンテキストの表示）", () => {
  const alice = "alice@example.com";
  const evil = "<script>alert(1)</script>";

  it("<script> を含むコミュニティ名・説明・タイトル・本文が、エスケープされた文字列として表示される", async () => {
    const { as } = setup();
    const cid = await createCommunity(as(alice), { name: `${evil}${unique("")}`, description: `説明${evil}` });
    const tid = await createThread(as(alice), cid, { title: `題${evil}`, body: `本文${evil}\n<b>太字</b>` });
    for (const path of ["/", "/c", `/c/${cid}`, `/t/${tid}`]) {
      const page = await html(await as(alice).get(path));
      expect(page.raw).not.toContain(evil);
      expect(page.raw).not.toContain("<b>太字</b>");
      expect(page.has("<script>alert(1)</script>")).toBe(true);
    }
    expect((await html(await as(alice).get(`/t/${tid}`))).raw).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("本文の改行がそのまま保持される", async () => {
    const { as } = setup();
    const cid = await createCommunity(as(alice));
    const tid = await createThread(as(alice), cid, { body: "1行目\n\n3行目" });
    expect((await html(await as(alice).get(`/t/${tid}`))).raw).toContain("1行目\n\n3行目");
  });
});
