import { describe, expect, test } from "bun:test";
import { resolveRoute } from "../lib/routing";

describe("resolveRoute", () => {
  const cases: Array<[string, string, unknown]> = [
    ["/", "", { kind: "redirect", to: "/en" }],
    ["/", "?a=1&b=2", { kind: "redirect", to: "/en?a=1&b=2" }],
    ["/en", "", { kind: "redirect", to: "/en/app" }],
    ["/es", "?x=1", { kind: "redirect", to: "/es/app?x=1" }],
    ["/es/", "", { kind: "redirect", to: "/es/app" }],
    ["/en/app", "", { kind: "next" }],
    ["/es/redesign", "?step=plan", { kind: "next" }],
    ["/fr", "", { kind: "notFound" }],
    ["/fr/app", "", { kind: "notFound" }],
    ["/pt-BR/app", "", { kind: "notFound" }],
    ["/redesign", "?step=plan", { kind: "redirect", to: "/en/redesign?step=plan" }],
    ["/app", "", { kind: "redirect", to: "/en/app" }],
    ["/broken/index.html", "", { kind: "next" }],
    ["/_next/static/x.js", "", { kind: "next" }],
    ["/api/audit", "", { kind: "next" }],
    ["/en/opengraph-image", "", { kind: "next" }],
    ["/favicon.ico", "", { kind: "next" }],
  ];
  for (const [path, search, expected] of cases) {
    test(`${path}${search} -> ${JSON.stringify(expected)}`, () => {
      expect(resolveRoute(path, search)).toEqual(expected as never);
    });
  }
});
