import { execFileSync } from "node:child_process";
import { expect, test } from "@playwright/test";
import { z } from "zod";

const totals = z.object({ violations: z.number().int().min(0), nodes: z.number().int().min(0) });
const outputSchema = z
  .object({
    before: totals,
    after: totals,
    steps: z.object({ before: z.number().int().min(1), after: z.number().int().min(1) }),
  })
  .strict();

test("measure prints one valid JSON document and nothing else on stdout", () => {
  const stdout = execFileSync(
    process.execPath,
    ["scripts/measure.mjs", "--no-build", "--no-write"],
    {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 180_000,
    },
  );
  const parsed = outputSchema.parse(JSON.parse(stdout));
  expect(stdout.trim().split("\n")).toHaveLength(1);
  expect(parsed.before.violations).toBeGreaterThan(0);
  expect(parsed.steps.after).toBeLessThan(parsed.steps.before);
});
