import type { Child } from "hono/jsx";
import { displayName } from "../../lib/display-name";

export const APP_NAME = "Marginalia";

/** 現在地。`in-communities` はコミュニティ配下（スレッドページなど）で、上位の現在地として示す */
export type Nav = "home" | "communities" | "in-communities" | undefined;

/** CSS・フォントのキャッシュ更新用。アセットを変更したら上げる */
export const ASSET_VERSION = "1";

type LayoutProps = {
  /** ページ固有のタイトル。未指定ならアプリ名のみ */
  title?: string;
  user?: string;
  current?: Nav;
  /** ヘッダーの「投稿する」の初期値にするコミュニティ（コミュニティページ・スレッドページ） */
  postCommunityId?: number;
  children?: Child;
};

export function Layout({ title, user, current, postCommunityId, children }: LayoutProps) {
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
        <SiteHeader user={user} current={current} postCommunityId={postCommunityId} />
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

/** ヘッダーの主要操作「＋ 投稿する」。モバイルではアイコンのみ */
export function PostButton({ communityId }: { communityId?: number }) {
  const href = communityId === undefined ? "/t/new" : `/t/new?c=${communityId}`;
  return (
    <a class="post-button" href={href} aria-label="投稿する">
      <svg class="post-button__icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
        <path d="M8 2.5v11M2.5 8h11" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" fill="none" />
      </svg>
      <span class="post-button__label" aria-hidden="true">
        投稿する
      </span>
    </a>
  );
}

export function SiteHeader({ user, current, postCommunityId }: { user?: string; current?: Nav; postCommunityId?: number }) {
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
              <a
                class="site-nav__link"
                href="/c"
                aria-current={current === "communities" ? "page" : current === "in-communities" ? "true" : undefined}
              >
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
          {user && <PostButton communityId={postCommunityId} />}
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
  /** 見出しの文字数（長い見出しを一段小さく組む判定に使う）。title が文字列なら自動で数える */
  titleLength?: number;
};

export function PageHeader({ eyebrow, title, description, hue, actions, titleLength }: PageHeaderProps) {
  const long = titleLength !== undefined ? titleLength > 24 : isLong(title);
  return (
    <header
      class={hue === undefined ? "page-header" : "page-header page-header--community"}
      style={hue === undefined ? undefined : `--community-hue: ${hue}`}
    >
      {eyebrow && <p class="page-header__eyebrow">{eyebrow}</p>}
      <h1 class={long ? "page-header__title page-header__title--long" : "page-header__title"}>{title}</h1>
      {description && <p class="page-header__desc">{description}</p>}
      {actions && <div class="page-header__actions">{actions}</div>}
    </header>
  );
}
