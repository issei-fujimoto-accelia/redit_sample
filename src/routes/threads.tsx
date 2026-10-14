import { Hono } from "hono";
import { parseId } from "../services/result";
import * as posts from "../services/posts";
import { listCommunities } from "../services/communities";
import * as svc from "../services/threads";
import type { AppDeps, AppEnv } from "../types";
import { ThreadPage } from "../views/pages/thread";
import { ThreadNewPage } from "../views/pages/thread-new";
import { render } from "../views/render";

export function threadRoutes(deps: AppDeps) {
  const r = new Hono<AppEnv>();

  // `/:id` より先に定義する（ARCHITECTURE §5）
  r.get("/new", async (c) => {
    const communities = await listCommunities(c.env.DB);
    const selectedId = svc.parseCommunityId(c.req.query("c"));
    return render(c, <ThreadNewPage user={c.var.user} communities={communities} selectedId={selectedId} />);
  });

  r.post("/", async (c) => {
    const result = await svc.createThread(c.env.DB, c.var.user, deps.now(), await c.req.parseBody());
    if (result.ok) return c.redirect(`/t/${result.value}`, 303);
    const communities = await listCommunities(c.env.DB);
    return render(c, <ThreadNewPage user={c.var.user} communities={communities} state={result} />, result.status);
  });

  r.get("/:id", async (c) => {
    const { thread, posts } = await svc.getThreadWithPosts(c.env.DB, parseId(c.req.param("id")));
    return render(c, <ThreadPage user={c.var.user} thread={thread} posts={posts} />);
  });

  r.post("/:id/edit", async (c) => {
    const id = parseId(c.req.param("id"));
    const result = await svc.updateThreadTitle(c.env.DB, c.var.user, deps.now(), id, await c.req.parseBody());
    if (result.ok) return c.redirect(`/t/${id}`, 303);
    const data = await svc.getThreadWithPosts(c.env.DB, id);
    return render(c, <ThreadPage user={c.var.user} {...data} editTitle={result} />, result.status);
  });

  r.post("/:id/delete", async (c) => {
    const id = parseId(c.req.param("id"));
    const result = await svc.deleteThread(c.env.DB, c.var.user, id);
    if (result.ok) return c.redirect(`/c/${result.value}`, 303);
    const data = await svc.getThreadWithPosts(c.env.DB, id);
    return render(c, <ThreadPage
        user={c.var.user}
        {...data}
        deleteError={{ title: "このスレッドは削除できません", body: result.errors.delete ?? "" }}
      />, result.status);
  });

  r.post("/:id/posts", async (c) => {
    const id = parseId(c.req.param("id"));
    const result = await posts.createReply(c.env.DB, c.var.user, deps.now(), id, await c.req.parseBody());
    if (result.ok) return c.redirect(`/t/${id}#post-${result.value}`, 303);
    const data = await svc.getThreadWithPosts(c.env.DB, id);
    return render(c, <ThreadPage user={c.var.user} {...data} newReply={result} />, result.status);
  });

  return r;
}
