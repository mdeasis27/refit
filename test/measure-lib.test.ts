import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Window } from "happy-dom";
import {
  aggregate,
  buildOutput,
  countScreensInDocument,
  expandAll,
  expandLocales,
  normalizeRoute,
  parseRoutes,
} from "../scripts/measure-lib.mjs";

const root = resolve(import.meta.dir, "..");

function documentFrom(html: string): Document {
  const win = new Window();
  win.document.write(html);
  return win.document as unknown as Document;
}

describe("parseRoutes", () => {
  test("accepts a list of paths", () => {
    expect(parseRoutes({ steps: ["/en/redesign", "/en/redesign?step=plan"] })).toEqual([
      "/en/redesign",
      "/en/redesign?step=plan",
    ]);
  });
  test("drops the origin of absolute URLs", () => {
    expect(normalizeRoute("http://localhost:3000/en/redesign?step=2#top", 0)).toBe(
      "/en/redesign?step=2#top",
    );
  });
  test.each([
    [null],
    [{}],
    [{ steps: [] }],
    [{ steps: "/en" }],
    [{ steps: [42] }],
    [{ steps: ["en/redesign"] }],
    [{ steps: ["//evil.example/x"] }],
    [{ steps: [""] }],
  ])("rejects %j", (input) => {
    expect(() => parseRoutes(input)).toThrow();
  });
});

describe("expandLocales", () => {
  test("a localized route is measured in both locales", () => {
    expect(expandLocales("/en/redesign?step=plan")).toEqual([
      "/en/redesign?step=plan",
      "/es/redesign?step=plan",
    ]);
  });
  test("a bare locale root is expanded", () => {
    expect(expandLocales("/es")).toEqual(["/en", "/es"]);
  });
  test("other routes stay as given", () => {
    expect(expandLocales("/broken/index.html")).toEqual(["/broken/index.html"]);
    expect(expandLocales("/english/page")).toEqual(["/english/page"]);
  });
  test("expandAll removes duplicates", () => {
    expect(expandAll(["/en/x", "/es/x", "/other"])).toEqual(["/en/x", "/es/x", "/other"]);
  });
});

describe("aggregate", () => {
  test("sums failed rules and failing nodes per page", () => {
    const totals = aggregate([
      {
        url: "/a",
        rules: [
          { id: "label", nodes: 3 },
          { id: "color-contrast", nodes: 5 },
        ],
      },
      { url: "/b", rules: [{ id: "label", nodes: 1 }] },
      { url: "/c", rules: [] },
    ]);
    expect(totals).toEqual({ violations: 3, nodes: 9 });
  });
  test("no pages gives zeros", () => {
    expect(aggregate([])).toEqual({ violations: 0, nodes: 0 });
  });
});

describe("buildOutput", () => {
  test("has exactly the keys of the brief, in order", () => {
    const out = buildOutput(
      { violations: 1, nodes: 2 },
      { violations: 0, nodes: 0 },
      { before: 5, after: 3 },
    );
    expect(JSON.stringify(out)).toBe(
      '{"before":{"violations":1,"nodes":2},"after":{"violations":0,"nodes":0},"steps":{"before":5,"after":3}}',
    );
  });
});

describe("countScreensInDocument", () => {
  test("counts the five screens of the old flow", () => {
    const html = readFileSync(resolve(root, "broken/index.html"), "utf8");
    const css = readFileSync(resolve(root, "broken/style.css"), "utf8");
    const withCss = html.replace("</head>", `<style>${css}</style></head>`);
    expect(countScreensInDocument(documentFrom(withCss))).toBe(5);
  });

  test("a page with no hidden group is one screen", () => {
    const doc = documentFrom(
      "<body><main><section><input></section><section><button>Go</button></section></main></body>",
    );
    expect(countScreensInDocument(doc)).toBe(1);
  });

  test("hidden screens made with a CSS class are counted", () => {
    const doc = documentFrom(`<html><head><style>.off{display:none}</style></head><body>
      <div id="wizard">
        <div><input></div><div class="off"><input></div>
        <div class="off"><button>Pay</button></div><div class="off"><p>Done</p></div>
      </div></body></html>`);
    expect(countScreensInDocument(doc)).toBe(4);
  });

  test("a carousel without controls is not a flow", () => {
    const doc = documentFrom(`<body><div>
      <div>One</div><div hidden>Two</div><div hidden>Three</div></div></body>`);
    expect(countScreensInDocument(doc)).toBe(1);
  });

  test("a hidden fixed overlay does not make a screen", () => {
    const doc = documentFrom(`<body>
      <div><input></div>
      <div style="position:fixed" hidden><button>Close</button></div></body>`);
    expect(countScreensInDocument(doc)).toBe(1);
  });

  test("several visible sections are not a stepper", () => {
    const doc = documentFrom(
      `<body><div><div><input></div><div><input></div><div hidden>x</div></div></body>`,
    );
    expect(countScreensInDocument(doc)).toBe(1);
  });

  test("the largest qualifying group wins", () => {
    const doc = documentFrom(`<body>
      <div id="small"><div><input></div><div hidden>b</div></div>
      <div id="big"><div><input></div><div hidden>b</div><div hidden>c</div><div hidden>d</div></div>
    </body>`);
    expect(countScreensInDocument(doc)).toBe(4);
  });
});
