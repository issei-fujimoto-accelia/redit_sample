import { Hono } from "hono";
import { auth } from "./middleware/auth";
import { notFound, onError } from "./middleware/error";
import { origin } from "./middleware/origin";
import { communityRoutes } from "./routes/communities";
import { devRoutes } from "./routes/dev";
import { postRoutes } from "./routes/posts";
import { threadRoutes } from "./routes/threads";
import type { AppDeps, AppEnv } from "./types";
import { Layout, PageHeader } from "./views/components/site";
import { render } from "./views/render";

export function createApp(deps: AppDeps) {
  const app = new Hono<AppEnv>();

  app.onError(onError);
  app.notFound(notFound);
  app.use("*", auth(deps));
  app.use("*", origin());

  app.get("/", (c) =>
    render(
      c,
      <Layout user={c.var.user} current="home">
        <PageHeader title="ホーム" />
      </Layout>,
    ),
  );

  app.route("/c", communityRoutes(deps));
  app.route("/t", threadRoutes(deps));
  app.route("/p", postRoutes(deps));
  app.route("/_styleguide", devRoutes);

  return app;
}
