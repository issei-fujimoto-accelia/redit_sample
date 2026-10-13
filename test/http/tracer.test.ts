import { describe, expect, it } from "vitest";
import { html, setup } from "../helpers";

describe("tracer", () => {
  it("GET / はホームとコミュニティ一覧へのリンクを含む HTML を返す", async () => {
    const { as } = setup();
    const res = await as("alice@example.com").get("/");
    expect(res.status).toBe(200);
    const page = await html(res);
    expect(page.links).toContain("/");
    expect(page.links).toContain("/c");
  });
});
