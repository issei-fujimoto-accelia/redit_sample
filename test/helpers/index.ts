import { env } from "cloudflare:test";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT, type JWK } from "jose";
import { createApp } from "../../src/app";
import type { Bindings } from "../../src/types";

export const TEAM_DOMAIN = "https://test-team.cloudflareaccess.com";
export const POLICY_AUD = "test-policy-aud";
export const ALLOWED_EMAIL_DOMAIN = "example.com";
export const ORIGIN = "http://localhost";

const KID = "test-key";
const keys = await generateKeyPair("RS256");
const otherKeys = await generateKeyPair("RS256");
const publicJwk: JWK = { ...(await exportJWK(keys.publicKey)), kid: KID, alg: "RS256", use: "sig" };
export const testJwks = createLocalJWKSet({ keys: [publicJwk] });

/** 手動で進める時計 */
export function createClock(start = "2026-01-01T00:00:00.000Z") {
  let t = new Date(start).getTime();
  return {
    now: () => new Date(t),
    /** ミリ秒単位で進める（既定は1分） */
    advance: (ms = 60_000) => {
      t += ms;
    },
    set: (iso: string) => {
      t = new Date(iso).getTime();
    },
  };
}
export type Clock = ReturnType<typeof createClock>;

type TokenOverrides = {
  iss?: string;
  aud?: string;
  /** 有効期限（秒、UNIX 時刻）。未指定時は時計の現在時刻＋1時間 */
  exp?: number;
  email?: string | null;
  /** 別の鍵で署名する（署名不正のケース） */
  wrongKey?: boolean;
};

/** テスト用の鍵で Access JWT を署名する */
export async function tokenFor(email: string, clock: Clock, overrides: TokenOverrides = {}) {
  const nowSec = Math.floor(clock.now().getTime() / 1000);
  const claims: Record<string, unknown> = {};
  const em = overrides.email === undefined ? email : overrides.email;
  if (em !== null) claims.email = em;
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "RS256", kid: KID })
    .setIssuer(overrides.iss ?? TEAM_DOMAIN)
    .setAudience(overrides.aud ?? POLICY_AUD)
    .setIssuedAt(nowSec)
    .setExpirationTime(overrides.exp ?? nowSec + 3600)
    .sign(overrides.wrongKey ? otherKeys.privateKey : keys.privateKey);
}

export type TestEnvOverrides = Partial<Bindings>;

/** テスト用のアプリと、ユーザーごとのリクエスト関数を作る */
export function setup(opts: { clock?: Clock; env?: TestEnvOverrides } = {}) {
  const clock = opts.clock ?? createClock();
  const app = createApp({ now: clock.now, jwks: testJwks });
  const testEnv: Bindings = {
    ...env,
    TEAM_DOMAIN,
    POLICY_AUD,
    ALLOWED_EMAIL_DOMAIN,
    AUTH_MODE: undefined,
    DEV_USER_EMAIL: undefined,
    ...opts.env,
  };

  const request = (path: string, init: RequestInit = {}) => app.request(path, init, testEnv);

  /** 指定ユーザーの JWT と自ホストの Origin を付けて送る */
  const as = (email: string) => {
    const headers = async (extra?: HeadersInit) => {
      const h = new Headers(extra);
      h.set("Cf-Access-Jwt-Assertion", await tokenFor(email, clock));
      h.set("Origin", ORIGIN);
      return h;
    };
    return {
      get: async (path: string, init: RequestInit = {}) =>
        request(path, { ...init, method: "GET", headers: await headers(init.headers) }),
      post: async (path: string, form: Record<string, string> = {}, init: RequestInit = {}) =>
        request(path, {
          ...init,
          method: "POST",
          headers: await headers(init.headers),
          body: new URLSearchParams(form),
        }),
    };
  };

  return { app, clock, env: testEnv, request, as };
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", "#x27": "'", nbsp: " " };
const decode = (s: string) => s.replace(/&(#?\w+);/g, (m, e: string) => ENTITIES[e] ?? m);

/** レスポンスの HTML から、表示内容を確認するための情報を取り出す */
export async function html(res: Response) {
  const raw = await res.text();
  const body = raw.replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ");
  const text = decode(body.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
  const attrs = (tag: string, attr: string) =>
    [...body.matchAll(new RegExp(`<${tag}\\b[^>]*\\b${attr}="([^"]*)"`, "gi"))].map((m) => decode(m[1] ?? ""));
  return {
    raw,
    text,
    links: attrs("a", "href"),
    formActions: attrs("form", "action"),
    has: (s: string) => text.includes(s),
  };
}

type Client = ReturnType<ReturnType<typeof setup>["as"]>;

/** `Location` の末尾の ID（`/c/12`、`/t/3#post-9` など）を取り出す */
export function idFrom(res: Response, kind: "c" | "t" | "post"): number {
  const loc = res.headers.get("Location") ?? "";
  const m = kind === "post" ? loc.match(/#post-(\d+)$/) : loc.match(new RegExp(`^/${kind}/(\\d+)`));
  if (!m) throw new Error(`unexpected Location: ${res.status} ${loc}`);
  return Number(m[1]);
}

let seq = 0;
/** テストごとに一意な名前を作る（同じファイル内で DB を共有するため） */
export const unique = (prefix = "名前") => `${prefix}-${++seq}-${Math.random().toString(36).slice(2, 7)}`;

export async function createCommunity(client: Client, form: { name?: string; description?: string } = {}) {
  const res = await client.post("/c", { name: form.name ?? unique("コミュニティ"), description: form.description ?? "" });
  return idFrom(res, "c");
}

export async function createThread(client: Client, communityId: number, form: { title?: string; body?: string } = {}) {
  const res = await client.post(`/c/${communityId}/threads`, {
    title: form.title ?? unique("スレッド"),
    body: form.body ?? "本文です。",
  });
  return idFrom(res, "t");
}

export async function reply(client: Client, threadId: number, body = "返信です。") {
  const res = await client.post(`/t/${threadId}/posts`, { body });
  return idFrom(res, "post");
}
