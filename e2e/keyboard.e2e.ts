import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { dictionaries } from "../lib/i18n/dictionaries";
import { activeElement, LOCALES, tabTo } from "./helpers";

for (const lang of LOCALES) {
  const t = dictionaries[lang].flow;

  test(`${lang}: the whole task can be finished with the keyboard only`, async ({ page }) => {
    await page.goto(`/${lang}/redesign`, { waitUntil: "networkidle" });

    // Account: three fields, Enter submits.
    await tabTo(page, (el) => el.id === "account-name");
    await page.keyboard.type("Ana Pérez");
    await page.keyboard.press("Tab");
    expect((await activeElement(page)).id).toBe("account-email");
    await page.keyboard.type("ana@example.com");
    await page.keyboard.press("Tab");
    expect((await activeElement(page)).id).toBe("account-password");
    await page.keyboard.type("correct horse battery");
    await page.keyboard.press("Enter");

    // Plan: the heading takes focus, Pro is already chosen, arrows move the choice.
    await expect(page.getByRole("heading", { level: 1, name: t.plan.title })).toBeFocused();
    await page.keyboard.press("Tab");
    const pro = page.getByRole("radio", { name: new RegExp(t.plan.pro.name) });
    await expect(pro).toBeFocused();
    await expect(pro).toBeChecked();
    await page.keyboard.press("ArrowUp");
    await expect(page.getByRole("radio", { name: new RegExp(t.plan.free.name) })).toBeChecked();
    await page.keyboard.press("ArrowDown");
    await expect(pro).toBeChecked();

    await tabTo(page, (el) => el.tag === "BUTTON" && el.text === t.plan.submit);
    await page.keyboard.press("Enter");

    // Done: confirmation names the person and the plan.
    await expect(page.getByRole("heading", { level: 1, name: t.done.title })).toBeFocused();
    const status = page.getByRole("status");
    await expect(status).toContainText("Ana Pérez");
    await expect(status).toContainText(t.plan.pro.name);
    await expect(page).toHaveURL(/step=done$/);

    // The real confirmation screen (not the empty state a direct visit shows) is clean too.
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
      .analyze();
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });

  test(`${lang}: errors are announced and reachable by keyboard`, async ({ page }) => {
    await page.goto(`/${lang}/redesign`, { waitUntil: "networkidle" });
    await tabTo(page, (el) => el.tag === "BUTTON" && el.text === t.account.submit);
    await page.keyboard.press("Enter");
    const summary = page.locator(".error-summary");
    await expect(summary).toBeFocused();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    expect((await activeElement(page)).id).toBe("account-name");
  });
}
