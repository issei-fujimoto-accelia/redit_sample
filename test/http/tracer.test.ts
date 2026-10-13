import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app";

describe("tracer", () => {
  it("GET / はホームとコミュニティ一覧へのリンクを含む HTML を返す", async () => {
    const app = createApp({ now: () => new Date("2026-01-01T00:00:00.000Z") });
    const res = await app.request("/", {}, env);
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain('href="/"');
    expect(body).toContain('href="/c"');
  });
});
