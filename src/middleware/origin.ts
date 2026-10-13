import { HTTPException } from "hono/http-exception";
import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../types";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * 更新系リクエストの Origin を自ホストと照合する（CSRF 対策、ARCHITECTURE §7.4）。
 * Hono の csrf ミドルウェアはフォーム系の Content-Type だけを検査し、Sec-Fetch-Site でも通すため、
 * ここでは「Origin が自ホストと一致すること」を全ての更新系リクエストに必須とする。
 */
export function origin(): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    if (!SAFE_METHODS.has(c.req.method)) {
      const value = c.req.header("Origin");
      if (!value || value !== new URL(c.req.url).origin) {
        throw new HTTPException(403, { message: "origin mismatch" });
      }
    }
    return next();
  };
}
