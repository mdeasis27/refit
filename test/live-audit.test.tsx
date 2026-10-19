import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { LiveAudit } from "../components/audit/LiveAudit";
import { dictionaries } from "../lib/i18n/dictionaries";

const realFetch = globalThis.fetch;
const copy = dictionaries.en.audit;

function stubFetch(handler: (init: RequestInit | undefined) => Response | Promise<Response>) {
  globalThis.fetch = (async (_url: unknown, init?: RequestInit) =>
    handler(init)) as unknown as typeof fetch;
}

beforeEach(() => cleanup());
afterEach(() => {
  cleanup();
  globalThis.fetch = realFetch;
});

describe("LiveAudit", () => {
  test("shows a button and sends the locale to the API", async () => {
    let sent: unknown;
    stubFetch((init) => {
      sent = JSON.parse(String(init?.body));
      return Response.json({
        ok: true,
        error: null,
        data: {
          provider: "groq",
          model: "some-model",
          latency_ms: 321,
          entries: [
            {
              id: "live-1",
              severity: "major",
              title: "<b>No labels</b>",
              where: "Step 1",
              fix: "Add labels",
              breaks: [{ kind: "wcag", label: "WCAG 1.3.1" }],
            },
          ],
        },
      });
    });
    render(<LiveAudit locale="en" />);
    fireEvent.click(screen.getByRole("button", { name: copy.runButton }));

    expect(await screen.findByText(copy.provenanceLive)).toBeDefined();
    expect(sent).toEqual({ locale: "en" });
    expect(screen.getByText(/groq, some-model, 321 ms/)).toBeDefined();
    // Model text is shown as text, never parsed as markup.
    expect(screen.getByText("<b>No labels</b>")).toBeDefined();
    expect(document.querySelector("h4 b")).toBeNull();
  });

  test("falls back to a message when the API says no", async () => {
    stubFetch(() =>
      Response.json({ ok: false, data: null, error: "rate-limited" }, { status: 429 }),
    );
    render(<LiveAudit locale="en" />);
    fireEvent.click(screen.getByRole("button", { name: copy.runButton }));
    expect(await screen.findByText(copy.failed)).toBeDefined();
    expect(screen.queryByText(copy.provenanceLive)).toBeNull();
  });

  test("falls back when the network fails or the answer is not JSON", async () => {
    stubFetch(() => {
      throw new Error("offline");
    });
    render(<LiveAudit locale="es" />);
    fireEvent.click(screen.getByRole("button", { name: dictionaries.es.audit.runButton }));
    expect(await screen.findByText(dictionaries.es.audit.failed)).toBeDefined();

    cleanup();
    stubFetch(() => new Response("<html>oops</html>", { status: 500 }));
    render(<LiveAudit locale="en" />);
    fireEvent.click(screen.getByRole("button", { name: copy.runButton }));
    expect(await screen.findByText(copy.failed)).toBeDefined();
  });
});
