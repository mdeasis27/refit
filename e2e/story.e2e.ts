import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { dictionaries } from "../lib/i18n/dictionaries";
import { LOCALES } from "./helpers";

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

for (const lang of LOCALES) {
  const t = dictionaries[lang];

  test(`/${lang}/app: no axe violations (the old flow iframe is the thing being audited)`, async ({
    page,
  }) => {
    await page.goto(`/${lang}/app`, { waitUntil: "networkidle" });
    const results = await new AxeBuilder({ page }).withTags(TAGS).exclude("iframe").analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });

  test(`/${lang}/app: fits 375 px without horizontal scroll`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto(`/${lang}/app`, { waitUntil: "networkidle" });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test(`/${lang}/app: one h1, the right language and the portfolio link first`, async ({
    page,
  }) => {
    await page.goto(`/${lang}/app`, { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("html")).toHaveAttribute("lang", lang);
    const back = page.getByRole("link", { name: t.nav.back });
    await expect(back).toHaveAttribute(
      "href",
      `https://portafolio-mdea.vercel.app/${lang}/projects`,
    );
    expect(await page.title()).toBe(t.meta.appTitle);
  });

  test(`/${lang}/app: Compare shows the numbers that measure wrote`, async ({ page }) => {
    await page.goto(`/${lang}/app`, { waitUntil: "networkidle" });
    const measured = (await import("../data/measure.json", { with: { type: "json" } })).default;
    const first = page.locator("table.numbers tbody tr").first();
    await expect(first.locator('[data-metric="before"]')).toHaveText(
      String(measured.before.violations),
    );
    await expect(first.locator('[data-metric="after"]')).toContainText(
      String(measured.after.violations),
    );
  });

  test(`/${lang}/opengraph-image is a PNG`, async ({ request }) => {
    const response = await request.get(`/${lang}/opengraph-image`);
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toContain("image/png");
  });

  test(`/${lang}/app: the audit is the maintainer's, with no model button in demo mode`, async ({
    page,
  }) => {
    await page.goto(`/${lang}/app`, { waitUntil: "networkidle" });
    await expect(page.getByText(t.audit.provenanceDemo)).toBeVisible();
    await expect(page.getByRole("button", { name: t.audit.runButton })).toHaveCount(0);
  });

  test(`/${lang}/app: the embedded redesign works`, async ({ page }) => {
    await page.goto(`/${lang}/app`, { waitUntil: "networkidle" });
    const c = t.flow.account;
    await page.getByLabel(c.nameLabel).fill("Ana");
    await page.getByLabel(c.emailLabel).fill("ana@example.com");
    await page.getByLabel(c.passwordLabel).fill("correct horse");
    await page.getByRole("button", { name: c.submit }).click();
    await page.getByRole("button", { name: t.flow.plan.submit }).click();
    await expect(page.getByRole("status")).toContainText("Ana");
    await expect(page).toHaveURL(new RegExp(`/${lang}/app$`));
  });
}

test("the language switch keeps the page and the query", async ({ page }) => {
  await page.goto("/en/redesign?step=plan", { waitUntil: "networkidle" });
  await page.locator('.lang-switch a[lang="es"]').click();
  await expect(page).toHaveURL(/\/es\/redesign\?step=plan$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
});

test("the audit API is closed in demo mode", async ({ request }) => {
  const response = await request.post("/api/audit", { data: { locale: "en" } });
  expect(response.status()).toBe(404);
  expect(await response.json()).toEqual({ ok: false, data: null, error: "not-live" });
});
