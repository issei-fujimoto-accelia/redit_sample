import { Hono } from "hono";
import * as svc from "../services/communities";
import * as threads from "../services/threads";
import { parseId } from "../services/result";
import type { AppDeps, AppEnv } from "../types";
import { CommunityListPage, CommunityPage } from "../views/pages/communities";
import { render } from "../views/render";

export function communityRoutes(deps: AppDeps) {
  const r = new Hono<AppEnv>();

  r.get("/", async (c) => {
    const communities = await svc.listCommunities(c.env.DB);
    return render(c, <CommunityListPage user={c.var.user} communities={communities} />);
  });

  r.post("/", async (c) => {
    const form = await c.req.parseBody();
    const result = await svc.createCommunity(c.env.DB, c.var.user, deps.now(), form);
    if (result.ok) return c.redirect(`/c/${result.value}`, 303);
    const communities = await svc.listCommunities(c.env.DB);
    return render(c, <CommunityListPage user={c.var.user} communities={communities} create={result} />, result.status);
  });

  /** コミュニティページの描画に必要なデータ（再描画でも使う） */
  const load = async (db: D1Database, id: number, page = 1) => {
    const community = await svc.getCommunity(db, id);
    const list = await threads.listThreads(db, page, id);
    return { community, list };
  };

  r.get("/:id", async (c) => {
    const data = await load(c.env.DB, parseId(c.req.param("id")), threads.parsePage(c.req.query("page")));
    return render(c, <CommunityPage user={c.var.user} {...data} />);
  });

  r.post("/:id/edit", async (c) => {
    const id = parseId(c.req.param("id"));
    const form = await c.req.parseBody();
    const result = await svc.updateCommunity(c.env.DB, c.var.user, deps.now(), id, form);
    if (result.ok) return c.redirect(`/c/${id}`, 303);
    return render(c, <CommunityPage user={c.var.user} {...await load(c.env.DB, id)} edit={result} />, result.status);
  });

  r.post("/:id/delete", async (c) => {
    const id = parseId(c.req.param("id"));
    const result = await svc.deleteCommunity(c.env.DB, c.var.user, id);
    if (result.ok) return c.redirect("/c", 303);
    return render(
      c,
      <CommunityPage user={c.var.user} {...await load(c.env.DB, id)} deleteError={result.errors.delete} />,
      result.status,
    );
  });

  r.post("/:id/threads", async (c) => {
    const id = parseId(c.req.param("id"));
    const form = await c.req.parseBody();
    const result = await threads.createThread(c.env.DB, c.var.user, deps.now(), id, form);
    if (result.ok) return c.redirect(`/t/${result.value}`, 303);
    return render(c, <CommunityPage user={c.var.user} {...await load(c.env.DB, id)} newThread={result} />, result.status);
  });

  return r;
}
