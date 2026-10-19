import { cpSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";

/** Copies every file of `source` into `target`, byte for byte, replacing `target`. */
export function copyBroken(source: string, target: string): string[] {
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  const names = readdirSync(source);
  for (const name of names) {
    cpSync(join(source, name), join(target, name), { recursive: true });
  }
  return names;
}

if (import.meta.main) {
  const root = resolve(import.meta.dir, "..");
  copyBroken(join(root, "broken"), join(root, "public", "broken"));
}
