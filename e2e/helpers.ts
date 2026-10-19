import type { Page } from "@playwright/test";

export interface FocusInfo {
  id: string;
  tag: string;
  text: string;
  outlineWidth: number;
  outlineStyle: string;
}

export async function activeElement(page: Page): Promise<FocusInfo> {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) {
      return { id: "", tag: "BODY", text: "", outlineWidth: 0, outlineStyle: "none" };
    }
    const style = getComputedStyle(el);
    return {
      id: el.id,
      tag: el.tagName,
      text: (el.textContent ?? "").trim().slice(0, 80),
      outlineWidth: Number.parseFloat(style.outlineWidth),
      outlineStyle: style.outlineStyle,
    };
  });
}

/**
 * Presses Tab until `match` accepts the focused element. Every stop on the way must show a focus
 * ring, so a missing indicator fails the test. Gives up after `limit` presses.
 */
export async function tabTo(
  page: Page,
  match: (info: FocusInfo) => boolean,
  limit = 30,
): Promise<FocusInfo> {
  for (let i = 0; i < limit; i += 1) {
    await page.keyboard.press("Tab");
    const info = await activeElement(page);
    if (info.tag === "BODY") continue;
    const visible = info.outlineStyle !== "none" && info.outlineWidth > 0;
    if (!visible) throw new Error(`No visible focus ring on <${info.tag}> "${info.text}"`);
    if (match(info)) return info;
  }
  throw new Error(`Tab never reached the expected element in ${limit} presses`);
}

export const LOCALES = ["en", "es"] as const;
export const STEPS = ["", "?step=plan", "?step=done"] as const;
