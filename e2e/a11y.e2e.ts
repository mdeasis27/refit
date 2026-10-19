import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { LOCALES, STEPS } from "./helpers";

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

for (const lang of LOCALES) {
  for (const step of STEPS) {
    const route = `/${lang}/redesign${step}`;

    test(`${route}: no axe violations, best-practice rules included`, async ({ page }) => {
      await page.goto(route, { waitUntil: "networkidle" });
      const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    });

    test(`${route}: fits 375 px without horizontal scroll`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 800 });
      await page.goto(route, { waitUntil: "networkidle" });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });

    test(`${route}: has one h1, a title and the right language`, async ({ page }) => {
      await page.goto(route, { waitUntil: "networkidle" });
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("html")).toHaveAttribute("lang", lang);
      expect((await page.title()).length).toBeGreaterThan(3);
    });
  }
}
