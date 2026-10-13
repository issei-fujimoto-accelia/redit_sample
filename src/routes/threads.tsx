import { Hono } from "hono";
import { parseId } from "../services/result";
import * as posts from "../services/posts";
import * as svc from "../services/threads";
import type { AppDeps, AppEnv } from "../types";
import { ThreadPage } from "../views/pages/thread";
import { render } from "../views/render";

export function threadRoutes(deps: AppDeps) {
  const r = new Hono<AppEnv>();

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
