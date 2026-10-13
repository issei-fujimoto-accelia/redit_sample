import { describe, expect, it } from "vitest";
import { setup, tokenFor } from "../helpers";

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
