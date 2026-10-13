import type { Child } from "hono/jsx";
import { displayName } from "../lib/display-name";

export type Nav = "home" | "communities" | undefined;

type Props = {
  title: string;
  user?: string;
  current?: Nav;
  children?: Child;
};

export function Layout({ title, user, current, children }: Props) {
  return (
    <html lang="ja">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
      </head>
      <body>
        <a href="#main">本文へスキップ</a>
        <header>
          <nav aria-label="メイン">
            <a href="/" aria-current={current === "home" ? "page" : undefined}>
              ホーム
            </a>
            <a href="/c" aria-current={current === "communities" ? "page" : undefined}>
              コミュニティ
            </a>
          </nav>
          {user && <span>{displayName(user)}</span>}
        </header>
        <main id="main">{children}</main>
        <footer></footer>
      </body>
    </html>
  );
}
