import { Hono } from "hono";
import * as svc from "../services/communities";
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

  r.get("/:id", async (c) => {
    const community = await svc.getCommunity(c.env.DB, parseId(c.req.param("id")));
    return render(c, <CommunityPage user={c.var.user} community={community} />);
  });

  r.post("/:id/edit", async (c) => {
    const id = parseId(c.req.param("id"));
    const form = await c.req.parseBody();
    const result = await svc.updateCommunity(c.env.DB, c.var.user, deps.now(), id, form);
    if (result.ok) return c.redirect(`/c/${id}`, 303);
    const community = await svc.getCommunity(c.env.DB, id);
    return render(c, <CommunityPage user={c.var.user} community={community} edit={result} />, result.status);
  });

  r.post("/:id/delete", async (c) => {
    const id = parseId(c.req.param("id"));
    const result = await svc.deleteCommunity(c.env.DB, c.var.user, id);
    if (result.ok) return c.redirect("/c", 303);
    const community = await svc.getCommunity(c.env.DB, id);
    return render(
      c,
      <CommunityPage user={c.var.user} community={community} deleteError={result.errors.delete} />,
      result.status,
    );
  });

  return r;
}
