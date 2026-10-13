import { Hono } from "hono";
import { displayName } from "./lib/display-name";
import { auth } from "./middleware/auth";
import type { AppDeps, AppEnv } from "./types";

export function createApp(deps: AppDeps) {
  const app = new Hono<AppEnv>();

  app.use("*", auth(deps));

  app.get("/", (c) =>
    c.html(
      <html lang="ja">
        <body>
          <nav>
            <a href="/">ホーム</a>
            <a href="/c">コミュニティ</a>
            <span>{displayName(c.var.user)}</span>
          </nav>
          <main>
            <h1>ホーム</h1>
          </main>
        </body>
      </html>,
    ),
  );

  return app;
}
