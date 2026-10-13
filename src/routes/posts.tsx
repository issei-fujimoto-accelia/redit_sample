import { Hono } from "hono";
import * as svc from "../services/posts";
import { parseId } from "../services/result";
import { getThreadWithPosts } from "../services/threads";
import type { AppDeps, AppEnv } from "../types";
import { ThreadPage } from "../views/pages/thread";
import { render } from "../views/render";

export function postRoutes(deps: AppDeps) {
  const r = new Hono<AppEnv>();

  r.post("/:id/edit", async (c) => {
    const id = parseId(c.req.param("id"));
    const result = await svc.updatePost(c.env.DB, c.var.user, deps.now(), id, await c.req.parseBody());
    if (result.ok) return c.redirect(`/t/${result.threadId}#post-${id}`, 303);
    const data = await getThreadWithPosts(c.env.DB, result.threadId);
    return render(c, <ThreadPage user={c.var.user} {...data} editPost={{ id, state: result }} />, result.status);
  });

  r.post("/:id/delete", async (c) => {
    const id = parseId(c.req.param("id"));
    const result = await svc.deleteReply(c.env.DB, c.var.user, id);
    if (result.ok) return c.redirect(`/t/${result.threadId}`, 303);
    const data = await getThreadWithPosts(c.env.DB, result.threadId);
    return render(
      c,
      <ThreadPage
        user={c.var.user}
        {...data}
        deleteError={{ title: "この投稿は削除できません", body: result.errors.delete ?? "" }}
      />,
      result.status,
    );
  });

  return r;
}
