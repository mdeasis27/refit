import type { Locale } from "./i18n/locales";

export const planIds = ["free", "pro", "team"] as const;
export type PlanId = (typeof planIds)[number];

export interface Plan {
  readonly id: PlanId;
  /** Integer cents, never a float. */
  readonly priceCents: number;
  readonly currency: "EUR";
}

export const plans: readonly Plan[] = [
  { id: "free", priceCents: 0, currency: "EUR" },
  { id: "pro", priceCents: 1900, currency: "EUR" },
  { id: "team", priceCents: 4900, currency: "EUR" },
];

export const defaultPlan: PlanId = "pro";

export function isPlanId(value: unknown): value is PlanId {
  return typeof value === "string" && (planIds as readonly string[]).includes(value);
}

const INTL_LOCALE: Record<Locale, string> = { en: "en-US", es: "es-ES" };

/** Formats integer cents as money. Throws on anything that is not a non-negative integer. */
export function formatPrice(cents: number, locale: Locale, currency = "EUR"): string {
  if (!Number.isInteger(cents) || cents < 0) {
    throw new RangeError(`Price must be a non-negative integer number of cents, got ${cents}`);
  }
  const whole = Math.trunc(cents / 100);
  const fraction = cents % 100;
  const formatter = new Intl.NumberFormat(INTL_LOCALE[locale], {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  });
  // Built from the integer parts, so no float arithmetic decides the digits shown.
  return formatter.format(Number(`${whole}.${String(fraction).padStart(2, "0")}`));
}
