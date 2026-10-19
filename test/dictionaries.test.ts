import { describe, expect, test } from "bun:test";
import { dictionaries, fill } from "../lib/i18n/dictionaries";

const BANNED = [
  "Brightdesk",
  "Google",
  "OpenAI",
  "Anthropic",
  "Vercel",
  "GitHub",
  "Gemini",
  "Groq",
  "OpenRouter",
  "Claude",
];

/** Keys whose value may name technologies (the Stack line). */
const EXEMPT_KEYS = new Set(["stackLine"]);
const EM_DASH = String.fromCharCode(0x2014);

function walk(value: unknown, key: string, out: Array<[string, string]>): void {
  if (typeof value === "string") out.push([key, value]);
  else if (Array.isArray(value)) for (const [i, v] of value.entries()) walk(v, `${key}[${i}]`, out);
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) walk(v, `${key}.${k}`, out);
  }
}

function strings(locale: "en" | "es"): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  walk(dictionaries[locale], locale, out);
  return out;
}

function shape(value: unknown): unknown {
  if (typeof value === "string") return "s";
  if (Array.isArray(value)) return value.map(shape);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shape(v)]));
  }
  return typeof value;
}

describe("dictionaries", () => {
  test("both locales have the same structure and no empty strings", () => {
    expect(shape(dictionaries.es)).toEqual(shape(dictionaries.en));
    for (const locale of ["en", "es"] as const) {
      for (const [key, text] of strings(locale)) expect(text.trim(), key).not.toBe("");
    }
  });

  test("no em dashes anywhere", () => {
    for (const locale of ["en", "es"] as const) {
      for (const [key, text] of strings(locale)) expect(text.includes(EM_DASH), key).toBe(false);
    }
  });

  test("no brand or company names in UI copy", () => {
    for (const locale of ["en", "es"] as const) {
      for (const [key, text] of strings(locale)) {
        if (EXEMPT_KEYS.has(key.split(".").pop() ?? "")) continue;
        for (const word of BANNED) expect(text.includes(word), `${key}: ${word}`).toBe(false);
      }
    }
  });

  test("placeholders match between locales", () => {
    const en = new Map(strings("en"));
    for (const [key, text] of strings("es")) {
      const enKey = key.replace(/^es/, "en");
      const holders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
      expect(holders(text), key).toEqual(holders(en.get(enKey) ?? ""));
    }
  });
});

describe("fill", () => {
  test("replaces known placeholders and keeps unknown ones", () => {
    expect(fill("Hi {name} {x}", { name: "Ana" })).toBe("Hi Ana {x}");
  });
});
