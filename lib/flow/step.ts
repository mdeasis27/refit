export const steps = ["account", "plan", "done"] as const;
export type Step = (typeof steps)[number];

export function isStep(value: unknown): value is Step {
  return typeof value === "string" && (steps as readonly string[]).includes(value);
}

/** Reads the `step` query value. Missing, repeated or unknown values mean the first step. */
export function parseStep(value: string | string[] | undefined | null): Step {
  const first = Array.isArray(value) ? value[0] : value;
  return isStep(first) ? first : "account";
}

export function stepIndex(step: Step): number {
  return steps.indexOf(step) + 1;
}

export function stepHref(pathname: string, step: Step): string {
  return step === "account" ? pathname : `${pathname}?step=${step}`;
}
