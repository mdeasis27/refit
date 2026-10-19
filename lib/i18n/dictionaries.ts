import type { Dictionary } from "./dictionary-type";
import { en } from "./en";
import { es } from "./es";
import type { Locale } from "./locales";

export type { Dictionary } from "./dictionary-type";

/** One typed source of every visible string: a missing translation is a type error. */
export const dictionaries: Record<Locale, Dictionary> = { en, es };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** Replaces `{name}` placeholders. Unknown placeholders are left as they are. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => {
    const value = values[key];
    return value === undefined ? whole : String(value);
  });
}
