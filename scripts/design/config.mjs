// デザイン確認用の共通設定（docs/UI_GUIDELINES.md §9.3〜9.4）。npm test には含めない。
import { mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

export const BASE_URL = process.env.BASE_URL ?? "http://localhost:8787";

export const VIEWPORTS = {
  mobile: { width: 390, height: 844 },
  desktop: { width: 1440, height: 900 },
};
export const SCHEMES = ["light", "dark"];

/** 対象ページ。各 Issue で画面を追加したらここに足す */
export const PAGES = [
  { name: "communities", path: "/c" },
  { name: "community", path: "/c/1" },
  { name: "community-empty", path: "/c/5" },
  { name: "community-paged", path: "/c/3?page=2" },
  { name: "thread", path: "/t/1" },
  { name: "thread-xss", path: "/t/6" },
  { name: "community-long", path: "/c/6" },
  { name: "styleguide", path: "/_styleguide" },
  { name: "error-403", path: "/_styleguide/error/403" },
  { name: "error-404", path: "/_styleguide/error/404" },
  { name: "error-500", path: "/_styleguide/error/500" },
  { name: "error-503", path: "/_styleguide/error/503" },
];

/** 対象を `--only=styleguide,error-404` で絞り込める */
export function selectedPages(argv = process.argv) {
  const only = argv.find((a) => a.startsWith("--only="))?.slice(7);
  if (!only) return PAGES;
  const names = only.split(",");
  return PAGES.filter((p) => names.includes(p.name));
}

/** `design/rounds/NN/`。ROUND 未指定時は既存の最大番号＋1 */
export function roundDir() {
  const root = path.resolve("design/rounds");
  mkdirSync(root, { recursive: true });
  let round = process.env.ROUND;
  if (!round) {
    const nums = readdirSync(root).map(Number).filter(Number.isFinite);
    round = String((nums.length ? Math.max(...nums) : 0) + 1).padStart(2, "0");
  }
  const dir = path.join(root, round);
  mkdirSync(dir, { recursive: true });
  return dir;
}

/** CHROMIUM_PATH で実行ファイルを指定できる（同梱ブラウザを使えない環境向け） */
export function launch() {
  return chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
}
