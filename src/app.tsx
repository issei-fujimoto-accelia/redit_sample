import { Hono } from "hono";
import type { AppDeps, AppEnv } from "./types";

export function createApp(deps: AppDeps) {
  const app = new Hono<AppEnv>();

  app.get("/", (c) =>
    c.html(
      <html lang="ja">
        <body>
          <nav>
            <a href="/">ホーム</a>
            <a href="/c">コミュニティ</a>
          </nav>
          <main>
            <h1>ホーム</h1>
          </main>
        </body>
      </html>,
    ),
  );

  void deps;
  return app;
}
