import { Hono } from "hono";
import { listCommunities } from "../services/communities";
import { listThreads, parsePage } from "../services/threads";
import type { AppEnv } from "../types";
import { HomePage } from "../views/pages/home";
import { render } from "../views/render";

export const homeRoutes = new Hono<AppEnv>();

homeRoutes.get("/", async (c) => {
  const [list, communities] = await Promise.all([
    listThreads(c.env.DB, parsePage(c.req.query("page"))),
    listCommunities(c.env.DB),
  ]);
  return render(c, <HomePage user={c.var.user} list={list} communities={communities} />);
});
