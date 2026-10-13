import { Hono } from "hono";
import { renderError } from "../middleware/error";
import type { AppEnv } from "../types";
import type { ErrorStatus } from "../views/ErrorPage";
import { render } from "../views/render";
import { Styleguide } from "../views/Styleguide";

/** 開発用ルート。AUTH_MODE=dev のときだけ有効で、それ以外は 404（UI_GUIDELINES §8.3） */
export const devRoutes = new Hono<AppEnv>();

devRoutes.use("*", async (c, next) => {
  if (c.env.AUTH_MODE !== "dev") return renderError(c, 404);
  return next();
});

devRoutes.get("/", (c) => render(c, <Styleguide user={c.var.user} />));

devRoutes.get("/error/:status", (c) => {
  const s = Number(c.req.param("status"));
  if (s === 403 || s === 404 || s === 500 || s === 503) return renderError(c, s as ErrorStatus);
  return renderError(c, 404);
});
