import { z } from "zod";
import measureJson from "@/data/measure.json";

const totals = z.object({
  violations: z.number().int().min(0),
  nodes: z.number().int().min(0),
});

/** The part of `data/measure.json` the page shows. The file is written by `bun run measure`. */
export const measureSchema = z.object({
  before: totals,
  after: totals,
  steps: z.object({ before: z.number().int().min(1), after: z.number().int().min(1) }),
  measuredAt: z.iso.datetime(),
  axeVersion: z.string().min(1),
});

export type MeasureData = z.infer<typeof measureSchema>;

export function parseMeasure(input: unknown): MeasureData {
  const parsed = measureSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("data/measure.json is missing or invalid. Run `bun run measure` to create it.");
  }
  return parsed.data;
}

/** The numbers measured by the product's own script, read when the page is built. */
export const measured: MeasureData = parseMeasure(measureJson);

/** Whole days are enough for the page, and an ISO date has no time zone surprises. */
export function measureDate(data: Pick<MeasureData, "measuredAt">): string {
  return data.measuredAt.slice(0, 10);
}
