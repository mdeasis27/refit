import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { copyBroken } from "../scripts/copy-broken";

const root = resolve(import.meta.dir, "..");
const sha = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex");
const shaLf = (path: string) =>
  createHash("sha256").update(readFileSync(path, "utf8").replace(/\r/g, "")).digest("hex");

describe("broken/", () => {
  test("copy is byte for byte identical", () => {
    const target = join(mkdtempSync(join(tmpdir(), "refit-")), "broken");
    const names = copyBroken(join(root, "broken"), target);
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(sha(join(target, name))).toBe(sha(join(root, "broken", name)));
    }
    expect(readdirSync(target).sort()).toEqual(readdirSync(join(root, "broken")).sort());
  });

  test("source files still match the committed hashes (never edit broken/)", () => {
    const lines = readFileSync(join(root, "broken.sha256"), "utf8").trim().split("\n");
    expect(lines.length).toBe(readdirSync(join(root, "broken")).length);
    for (const line of lines) {
      const [hash, file] = line.split(/\s+/);
      expect(shaLf(join(root, file ?? ""))).toBe(hash ?? "");
    }
  });
});
