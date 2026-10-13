import { describe, expect, it } from "vitest";
import { html, setup } from "../helpers";

describe("エラーページ", () => {
  it("未定義のパス → 404 と見つからない旨の表示", async () => {
    const res = await setup().as("alice@example.com").get("/no-such-page");
    expect(res.status).toBe(404);
    const page = await html(res);
    expect(page.has("見つかりません")).toBe(true);
    expect(page.links).toContain("/");
  });

  it("認証失敗 → 403 と共通エラーページ", async () => {
    const res = await setup().request("/");
    expect(res.status).toBe(403);
    expect((await html(res)).has("アクセスできません")).toBe(true);
  });
});
