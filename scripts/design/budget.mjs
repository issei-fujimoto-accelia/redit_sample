// 予算の確認（UI_GUIDELINES §8.2）：npm run design:budget
import { readdirSync, statSync } from "node:fs";
import path from "node:path";

const kb = (n) => Math.round((n / 1024) * 10) / 10;
const css = statSync("public/assets/app.css").size;
const fontDir = "public/assets/fonts";
const fonts = readdirSync(fontDir).filter((f) => f.endsWith(".woff2")).reduce((s, f) => s + statSync(path.join(fontDir, f)).size, 0);
const ok = css <= 40 * 1024 && fonts <= 100 * 1024;
console.log(`CSS:  ${kb(css)} KB / 40 KB`);
console.log(`Font: ${kb(fonts)} KB / 100 KB`);
process.exit(ok ? 0 : 1);
