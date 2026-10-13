import { Hono } from "hono";
import { parseId } from "../services/result";
import * as svc from "../services/threads";
import type { AppDeps, AppEnv } from "../types";
import { ThreadPage } from "../views/pages/thread";
import { render } from "../views/render";

export function threadRoutes(_deps: AppDeps) {
  const r = new Hono<AppEnv>();

  r.get("/:id", async (c) => {
    const { thread, posts } = await svc.getThreadWithPosts(c.env.DB, parseId(c.req.param("id")));
    return render(c, <ThreadPage user={c.var.user} thread={thread} posts={posts} />);
  });

  return r;
}
