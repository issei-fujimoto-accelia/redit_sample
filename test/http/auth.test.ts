import { describe, expect, it } from "vitest";
import { html, setup, tokenFor } from "../helpers";

const get = async (s: ReturnType<typeof setup>, token?: string) =>
  s.request("/", { headers: token ? { "Cf-Access-Jwt-Assertion": token } : {} });

describe("Access JWT の検証", () => {
  it("有効な JWT → 200", async () => {
    const s = setup();
    const res = await get(s, await tokenFor("alice@example.com", s.clock));
    expect(res.status).toBe(200);
  });

  it("ヘッダーにログイン中ユーザーの表示名が出る", async () => {
    const s = setup();
    const page = await html(await get(s, await tokenFor("alice@example.com", s.clock)));
    expect(page.has("alice")).toBe(true);
  });

  it("JWT なし → 403", async () => {
    expect((await get(setup())).status).toBe(403);
  });

  it("署名不正（別の鍵）→ 403", async () => {
    const s = setup();
    expect((await get(s, await tokenFor("alice@example.com", s.clock, { wrongKey: true }))).status).toBe(403);
  });

  it("形式不正の JWT → 403", async () => {
    expect((await get(setup(), "not-a-jwt")).status).toBe(403);
  });

  it("aud 不一致 → 403", async () => {
    const s = setup();
    expect((await get(s, await tokenFor("alice@example.com", s.clock, { aud: "other-aud" }))).status).toBe(403);
  });

  it("iss 不一致 → 403", async () => {
    const s = setup();
    const token = await tokenFor("alice@example.com", s.clock, { iss: "https://evil.cloudflareaccess.com" });
    expect((await get(s, token)).status).toBe(403);
  });

  it("期限切れ → 403", async () => {
    const s = setup();
    const token = await tokenFor("alice@example.com", s.clock);
    s.clock.advance(2 * 60 * 60 * 1000);
    expect((await get(s, token)).status).toBe(403);
  });

  it("対象外ドメインのメール → 403", async () => {
    const s = setup();
    expect((await get(s, await tokenFor("mallory@evil.example", s.clock))).status).toBe(403);
  });

  it("サブドメインを装ったメール → 403", async () => {
    const s = setup();
    expect((await get(s, await tokenFor("mallory@sub.notexample.com", s.clock))).status).toBe(403);
  });

  it("email クレームがない → 403", async () => {
    const s = setup();
    expect((await get(s, await tokenFor("x@example.com", s.clock, { email: null }))).status).toBe(403);
  });

  it("Access の設定（TEAM_DOMAIN など）が未設定なら 403（fail closed）", async () => {
    const s = setup({ env: { POLICY_AUD: undefined } });
    expect((await get(s, await tokenFor("alice@example.com", s.clock))).status).toBe(403);
  });
});

describe("AUTH_MODE", () => {
  it("AUTH_MODE=dev のとき JWT なしで DEV_USER_EMAIL として扱われる", async () => {
    const s = setup({ env: { AUTH_MODE: "dev", DEV_USER_EMAIL: "dev-user@example.com" } });
    const res = await get(s);
    expect(res.status).toBe(200);
    expect((await html(res)).has("dev-user")).toBe(true);
  });

  it("AUTH_MODE=dev でも DEV_USER_EMAIL が未設定なら 403", async () => {
    const s = setup({ env: { AUTH_MODE: "dev" } });
    expect((await get(s)).status).toBe(403);
  });

  it("AUTH_MODE がその他の値なら JWT 必須", async () => {
    const s = setup({ env: { AUTH_MODE: "development", DEV_USER_EMAIL: "dev-user@example.com" } });
    expect((await get(s)).status).toBe(403);
  });
});
