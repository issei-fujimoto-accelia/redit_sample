import { describe, expect, it } from "vitest";
import { createCommunity, html, setup, tokenFor, unique } from "../helpers";

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
