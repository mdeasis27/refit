import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, within } from "@testing-library/react";
import ProductPage from "../app/[lang]/app/page";
import { Compare } from "../components/story/Compare";
import { dictionaries } from "../lib/i18n/dictionaries";
import type { Locale } from "../lib/i18n/locales";
import { type MeasureData, measured, parseMeasure } from "../lib/measure/read";

afterEach(() => cleanup());

async function renderPage(lang: Locale) {
  const tree = await ProductPage({ params: Promise.resolve({ lang }) });
  return render(tree);
}

describe("story page", () => {
  for (const lang of ["en", "es"] as const) {
    const t = dictionaries[lang];

    test(`${lang}: sections come in the required order`, async () => {
      await renderPage(lang);
      const headings = [...document.querySelectorAll("main > section > h2, main > section > h1")];
      expect(headings.map((h) => h.textContent)).toEqual([
        t.meta.siteName,
        t.analogy.title,
        t.tryIt.title,
        t.compare.title,
        t.fits.title,
        t.proves.title,
      ]);
    });

    test(`${lang}: exactly one h1, and the flow embedded in it does not add another`, async () => {
      await renderPage(lang);
      expect(document.querySelectorAll("h1").length).toBe(1);
    });

    test(`${lang}: the engineers disclosure is native, collapsed and last`, async () => {
      await renderPage(lang);
      const main = document.querySelector("main");
      const last = main?.lastElementChild;
      expect(last?.tagName).toBe("DETAILS");
      expect(last?.hasAttribute("open")).toBe(false);
      expect(last?.querySelector("summary")?.textContent).toBe(t.engineers.summary);
      expect(last?.textContent).toContain("Stack: ");
      const link = last?.querySelector("a");
      expect(link?.getAttribute("href")).toBe("https://github.com/mdeasis27/refit");
    });

    test(`${lang}: the portfolio link is the first link and points to the right place`, async () => {
      await renderPage(lang);
      const first = document.querySelector("a");
      expect(first?.getAttribute("href")).toBe(
        `https://portafolio-mdea.vercel.app/${lang}/projects`,
      );
      expect(first?.textContent).toBe(t.nav.back);
    });

    test(`${lang}: the language switch marks the current language`, async () => {
      await renderPage(lang);
      const current = document.querySelector('.lang-switch a[aria-current="true"]');
      expect(current?.getAttribute("lang")).toBe(lang);
      expect(document.querySelectorAll(".lang-switch a").length).toBe(2);
    });

    test(`${lang}: the glossary has 3 to 5 terms`, async () => {
      await renderPage(lang);
      const terms = document.querySelectorAll(".glossary dt").length;
      expect(terms).toBeGreaterThanOrEqual(3);
      expect(terms).toBeLessThanOrEqual(5);
    });

    test(`${lang}: the audit says it was written by the maintainer, never by a model`, async () => {
      await renderPage(lang);
      expect(document.body.textContent).toContain(t.audit.provenanceDemo);
      expect(document.body.textContent).not.toContain(t.audit.provenanceLive);
      expect(document.querySelector(".live-audit")).toBeNull();
    });
  }

  test("old flow is embedded with a title and linked", async () => {
    await renderPage("en");
    const frame = document.querySelector("iframe");
    expect(frame?.getAttribute("title")).toBe(dictionaries.en.tryIt.beforeFrameTitle);
    expect(frame?.getAttribute("src")).toBe("/broken/index.html");
  });
});

describe("Compare", () => {
  const fixture: MeasureData = parseMeasure({
    before: { violations: 41, nodes: 77 },
    after: { violations: 2, nodes: 3 },
    steps: { before: 8, after: 4 },
    measuredAt: "2031-02-03T04:05:06.000Z",
    axeVersion: "9.9.9",
  });

  test("shows the numbers it is given, not numbers of its own", () => {
    const view = render(<Compare locale="en" data={fixture} />);
    const rows = [...view.container.querySelectorAll("tbody tr")];
    const cells = rows.map((row) => [
      row.querySelector('[data-metric="before"]')?.textContent,
      row.querySelector('[data-metric="after"]')?.textContent,
    ]);
    expect(cells).toEqual([
      ["41", "2 (39 fewer)"],
      ["77", "3 (74 fewer)"],
      ["8", "4 (4 fewer)"],
    ]);
    expect(view.container.textContent).toContain("2031-02-03");
    expect(view.container.textContent).toContain("9.9.9");
  });

  test("shows no change note when nothing improved", () => {
    const same = parseMeasure({
      ...fixture,
      after: fixture.before,
      steps: { before: 4, after: 4 },
    });
    const view = render(<Compare locale="es" data={same} />);
    expect(within(view.container).queryByText(/menos/)).toBeNull();
  });

  test("the page shows what data/measure.json holds", async () => {
    await renderPage("en");
    const table = document.querySelector("table.numbers");
    const first = table?.querySelector('tbody tr [data-metric="before"]');
    expect(first?.textContent).toBe(String(measured.before.violations));
  });

  test("rejects a measurement file with the wrong shape", () => {
    expect(() => parseMeasure({ before: 1 })).toThrow(/bun run measure/);
  });
});
