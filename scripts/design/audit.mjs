// アクセシビリティの機械チェック（axe、WCAG 2.2 AA）：npm run design:audit
import { AxeBuilder } from "@axe-core/playwright";
import { BASE_URL, SCHEMES, VIEWPORTS, launch, selectedPages } from "./config.mjs";

const browser = await launch();
let total = 0;
try {
  for (const page of selectedPages()) {
    for (const [vpName, viewport] of Object.entries(VIEWPORTS)) {
      for (const scheme of SCHEMES) {
        const context = await browser.newContext({ viewport, colorScheme: scheme });
        const p = await context.newPage();
        await p.goto(BASE_URL + page.path, { waitUntil: "networkidle" });
        // 開閉式の編集フォームの中身も検査する
        await p.evaluate(() => document.querySelectorAll("details").forEach((d) => (d.open = true)));
        const result = await new AxeBuilder({ page: p })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
          .analyze();
        const label = `${page.name} ${vpName}-${scheme}`;
        if (result.violations.length === 0) {
          console.log(`ok   ${label}`);
        } else {
          for (const v of result.violations) {
            total += v.nodes.length;
            console.log(`FAIL ${label}: [${v.impact}] ${v.id} — ${v.help}`);
            for (const n of v.nodes.slice(0, 5)) console.log(`       ${n.target.join(" ")} ${n.failureSummary?.split("\n")[1] ?? ""}`);
          }
        }
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
}
console.log(`\nviolations: ${total}`);
process.exit(total === 0 ? 0 : 1);
