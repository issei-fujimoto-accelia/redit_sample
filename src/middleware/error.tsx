import { HTTPException } from "hono/http-exception";
import type { Context, ErrorHandler, NotFoundHandler } from "hono";
import { ErrorPage, type ErrorStatus } from "../views/ErrorPage";
import { render } from "../views/render";
import type { AppEnv } from "../types";

/** 共通エラーページで応答する。内部情報（SQL、スタック）は出さない */
export function renderError(c: Context<AppEnv>, status: ErrorStatus) {
  return render(c, <ErrorPage status={status} user={c.get("user")} />, status);
}

/** D1 の日次上限超過などの一時的な失敗か */
function isUnavailable(err: Error): boolean {
  return /D1_ERROR/i.test(err.message) && /limit|exceeded|overloaded/i.test(err.message);
}

export const onError: ErrorHandler<AppEnv> = (err, c) => {
  if (err instanceof HTTPException) {
    const s = err.status;
    if (s === 403 || s === 404 || s === 503) return renderError(c, s);
    if (s >= 500) return renderError(c, 500);
    return err.getResponse();
  }
  console.error(err);
  return renderError(c, isUnavailable(err) ? 503 : 500);
};

export const notFound: NotFoundHandler<AppEnv> = (c) => renderError(c, 404);
