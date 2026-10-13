// スクリーンショットを撮る：npm run design:capture [-- --only=styleguide]
import path from "node:path";
import { BASE_URL, SCHEMES, VIEWPORTS, launch, roundDir, selectedPages } from "./config.mjs";

const dir = roundDir();
const browser = await launch();
try {
  for (const page of selectedPages()) {
    for (const [vpName, viewport] of Object.entries(VIEWPORTS)) {
      for (const scheme of SCHEMES) {
        const context = await browser.newContext({ viewport, colorScheme: scheme, deviceScaleFactor: 1 });
        const p = await context.newPage();
        await p.goto(BASE_URL + page.path, { waitUntil: "networkidle" });
        await p.evaluate(() => document.fonts.ready);
        const file = path.join(dir, `${page.name}--${vpName}-${scheme}.png`);
        await p.screenshot({ path: file, fullPage: true });
        console.log(file);
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
}
