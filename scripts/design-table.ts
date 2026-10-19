import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ratioLabel } from "../lib/design/contrast";
import { contrastPairs } from "../lib/design/pairs";

/** Prints the contrast table rows used in DESIGN.md. */
const css = readFileSync(resolve(import.meta.dir, "../app/tokens.css"), "utf8");
const tokens = new Map<string, string>();
for (const m of css.matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{6});/g)) {
  if (m[1] && m[2]) tokens.set(m[1], m[2]);
}
for (const p of contrastPairs) {
  const ratio = ratioLabel(tokens.get(p.foreground) ?? "", tokens.get(p.background) ?? "");
  console.log(
    `| \`${p.foreground}\` | \`${p.background}\` | ${p.use} | ${ratio}:1 | ${p.minimum}:1 | Pass |`,
  );
}
