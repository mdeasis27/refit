import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { contrastRatio, ratioLabel } from "../lib/design/contrast";
import { contrastPairs } from "../lib/design/pairs";

const root = resolve(import.meta.dir, "..");

function readTokens(): Map<string, string> {
  const css = readFileSync(resolve(root, "app/tokens.css"), "utf8");
  const map = new Map<string, string>();
  for (const m of css.matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{6});/g)) {
    if (m[1] && m[2]) map.set(m[1], m[2]);
  }
  return map;
}

describe("contrast math", () => {
  test("black on white is 21", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
  });
  test("#777777 on white is just under 4.5", () => {
    const ratio = contrastRatio("#777777", "#ffffff");
    expect(ratio).toBeGreaterThan(4.4);
    expect(ratio).toBeLessThan(4.5);
  });
  test("order of arguments does not matter", () => {
    expect(contrastRatio("#123456", "#fedcba")).toBeCloseTo(
      contrastRatio("#fedcba", "#123456"),
      10,
    );
  });
});

describe("tokens.css", () => {
  const tokens = readTokens();

  test("every declared pair meets its minimum", () => {
    for (const pair of contrastPairs) {
      const fg = tokens.get(pair.foreground);
      const bg = tokens.get(pair.background);
      expect(fg, `token ${pair.foreground}`).toBeDefined();
      expect(bg, `token ${pair.background}`).toBeDefined();
      const ratio = contrastRatio(fg ?? "", bg ?? "");
      expect(ratio, `${pair.foreground} on ${pair.background}`).toBeGreaterThanOrEqual(
        pair.minimum,
      );
    }
  });

  test("DESIGN.md lists the computed ratio of every pair", () => {
    const doc = readFileSync(resolve(root, "DESIGN.md"), "utf8");
    for (const pair of contrastPairs) {
      const fg = tokens.get(pair.foreground) ?? "";
      const bg = tokens.get(pair.background) ?? "";
      const row = doc
        .split("\n")
        .find(
          (line) =>
            line.includes(`\`${pair.foreground}\``) &&
            line.includes(`\`${pair.background}\``) &&
            line.includes(`${pair.use}`),
        );
      expect(row, `row for ${pair.foreground}/${pair.background}`).toBeDefined();
      expect(row).toContain(`${ratioLabel(fg, bg)}:1`);
    }
  });
});
