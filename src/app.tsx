import { Hono } from "hono";
import { auth } from "./middleware/auth";
import { notFound, onError } from "./middleware/error";
import { origin } from "./middleware/origin";
import type { AppDeps, AppEnv } from "./types";
import { Layout } from "./views/Layout";
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
      <Layout title="ホーム" user={c.var.user} current="home">
        <h1>ホーム</h1>
      </Layout>,
    ),
  );

  return app;
}
