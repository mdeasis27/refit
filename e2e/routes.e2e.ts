import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

test("/ redirects to /en keeping the query string", async ({ request }) => {
  const response = await request.get("/?a=1&b=two", { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(response.headers().location).toBe("/en?a=1&b=two");
});

test("/{lang} redirects to /{lang}/app", async ({ request }) => {
  for (const lang of ["en", "es"]) {
    const response = await request.get(`/${lang}?x=1`, { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(response.headers().location).toBe(`/${lang}/app?x=1`);
  }
});

test("a path without a locale gets /en", async ({ request }) => {
  const response = await request.get("/redesign?step=plan", { maxRedirects: 0 });
  expect(response.headers().location).toBe("/en/redesign?step=plan");
});

test("an unknown locale is a 404", async ({ request }) => {
  for (const path of ["/fr", "/fr/app", "/de/redesign"]) {
    expect((await request.get(path, { maxRedirects: 0 })).status()).toBe(404);
  }
});

test("an unknown page under a known locale is a localized 404", async ({ page }) => {
  const response = await page.goto("/es/nada");
  expect(response?.status()).toBe(404);
  await expect(page.locator("h1")).toHaveText("Página no encontrada");
});

test("/broken/index.html is served byte for byte", async ({ request }) => {
  const response = await request.get("/broken/index.html");
  expect(response.ok()).toBe(true);
  const served = await response.body();
  expect(served.equals(readFileSync(resolve(import.meta.dirname, "../broken/index.html")))).toBe(
    true,
  );
});
