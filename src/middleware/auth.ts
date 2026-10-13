import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";
import { HTTPException } from "hono/http-exception";
import type { MiddlewareHandler } from "hono";
import type { AppDeps, AppEnv } from "../types";

const remoteJwks = new Map<string, JWTVerifyGetKey>();

/** TEAM_DOMAIN ごとにリモート JWKS をキャッシュする（鍵は kid で照合して取得される） */
function remoteJwksFor(teamDomain: string): JWTVerifyGetKey {
  let jwks = remoteJwks.get(teamDomain);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL("/cdn-cgi/access/certs", teamDomain));
    remoteJwks.set(teamDomain, jwks);
  }
  return jwks;
}

const forbidden = () => new HTTPException(403, { message: "forbidden" });

/**
 * ユーザー識別（ARCHITECTURE §7.2〜7.3）。
 * - AUTH_MODE=dev のときだけ DEV_USER_EMAIL を使う。
 * - それ以外は Access JWT を検証する。検証できなければ 403（fail closed）。
 */
export function auth(deps: AppDeps): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const env = c.env;

    if (env.AUTH_MODE === "dev") {
      if (!env.DEV_USER_EMAIL) throw forbidden();
      c.set("user", env.DEV_USER_EMAIL.toLowerCase());
      return next();
    }

    const token = c.req.header("Cf-Access-Jwt-Assertion");
    const { TEAM_DOMAIN, POLICY_AUD, ALLOWED_EMAIL_DOMAIN } = env;
    if (!token || !TEAM_DOMAIN || !POLICY_AUD || !ALLOWED_EMAIL_DOMAIN) throw forbidden();

    let email: unknown;
    try {
      const { payload } = await jwtVerify(token, deps.jwks ?? remoteJwksFor(TEAM_DOMAIN), {
        issuer: TEAM_DOMAIN,
        audience: POLICY_AUD,
        currentDate: deps.now(),
      });
      email = payload.email;
    } catch {
      throw forbidden();
    }

    if (typeof email !== "string") throw forbidden();
    const normalized = email.toLowerCase();
    if (!normalized.endsWith(`@${ALLOWED_EMAIL_DOMAIN.toLowerCase()}`)) throw forbidden();

    c.set("user", normalized);
    return next();
  };
}
