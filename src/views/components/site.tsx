import type { Child } from "hono/jsx";
import { displayName } from "../../lib/display-name";

export const APP_NAME = "Marginalia";

export type Nav = "home" | "communities" | undefined;

/** CSS・フォントのキャッシュ更新用。アセットを変更したら上げる */
export const ASSET_VERSION = "1";

type LayoutProps = {
  /** ページ固有のタイトル。未指定ならアプリ名のみ */
  title?: string;
  user?: string;
  current?: Nav;
  children?: Child;
};

export function Layout({ title, user, current, children }: LayoutProps) {
  const fullTitle = title ? `${title} — ${APP_NAME}` : APP_NAME;
  return (
    <html lang="ja">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
        <title>{fullTitle}</title>
        <link
          rel="preload"
          href="/assets/fonts/fraunces-latin-opsz.woff2"
          as="font"
          type="font/woff2"
          crossorigin="anonymous"
        />
        <link rel="stylesheet" href={`/assets/app.css?v=${ASSET_VERSION}`} />
      </head>
      <body>
        <a class="skip-link" href="#main">
          本文へスキップ
        </a>
        <SiteHeader user={user} current={current} />
        <main id="main" class="site-main" tabindex={-1}>
          <div class="wrap">{children}</div>
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}

export function Wordmark() {
  return (
    <a class="wordmark" href="/" aria-label={`${APP_NAME} ホーム`}>
      <span aria-hidden="true">
        Margin<span class="wordmark__light">alia</span>
      </span>
    </a>
  );
}

export function SiteHeader({ user, current }: { user?: string; current?: Nav }) {
  return (
    <header class="site-header">
      <div class="wrap site-header__inner">
        <Wordmark />
        <nav class="site-nav" aria-label="メイン">
          <ul class="site-nav__list" role="list">
            <li>
              <a class="site-nav__link" href="/" aria-current={current === "home" ? "page" : undefined}>
                ホーム
              </a>
            </li>
            <li>
              <a class="site-nav__link" href="/c" aria-current={current === "communities" ? "page" : undefined}>
                コミュニティ
              </a>
            </li>
          </ul>
          {user && (
            <p class="site-user">
              <span class="visually-hidden">ログイン中：</span>
              <span class="site-user__name">{displayName(user)}</span>
            </p>
          )}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer class="site-footer">
      <div class="wrap site-footer__inner">
        <span class="site-footer__mark">{APP_NAME}</span>
        <span>議論の索引</span>
      </div>
    </footer>
  );
}

/** 長い見出し（コミュニティ名など）は一段小さく組む */
const isLong = (title: Child) => typeof title === "string" && [...title].length > 24;

type PageHeaderProps = {
  eyebrow?: Child;
  title: Child;
  description?: string;
  /** コミュニティ色相。指定するとコミュニティの見出しとして組む */
  hue?: number;
  actions?: Child;
};

export function PageHeader({ eyebrow, title, description, hue, actions }: PageHeaderProps) {
  return (
    <header
      class={hue === undefined ? "page-header" : "page-header page-header--community"}
      style={hue === undefined ? undefined : `--community-hue: ${hue}`}
    >
      {eyebrow && <p class="page-header__eyebrow">{eyebrow}</p>}
      <h1 class={isLong(title) ? "page-header__title page-header__title--long" : "page-header__title"}>{title}</h1>
      {description && <p class="page-header__desc">{description}</p>}
      {actions && <div class="page-header__actions">{actions}</div>}
    </header>
  );
}
