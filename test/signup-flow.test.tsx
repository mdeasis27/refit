import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SignupFlow } from "../components/flow/SignupFlow";
import type { Step } from "../lib/flow/step";
import { dictionaries } from "../lib/i18n/dictionaries";
import type { Locale } from "../lib/i18n/locales";

function mount(
  locale: Locale = "en",
  initialStep: Step = "account",
  headingLevel: "h1" | "h3" = "h1",
) {
  return render(
    <SignupFlow
      locale={locale}
      headingLevel={headingLevel}
      initialStep={initialStep}
      routed={false}
    />,
  );
}

beforeEach(() => {
  window.sessionStorage.clear();
});
afterEach(() => cleanup());

function fillAccount(locale: Locale = "en", password = "correct horse") {
  const c = dictionaries[locale].flow.account;
  fireEvent.change(screen.getByLabelText(c.nameLabel), { target: { value: "Ana Pérez" } });
  fireEvent.change(screen.getByLabelText(c.emailLabel), { target: { value: "ana@example.com" } });
  fireEvent.change(screen.getByLabelText(c.passwordLabel), { target: { value: password } });
}

describe("account step", () => {
  test("every input has a visible label and the right autocomplete", () => {
    mount();
    const c = dictionaries.en.flow.account;
    expect(screen.getByLabelText(c.nameLabel).getAttribute("autocomplete")).toBe("name");
    expect(screen.getByLabelText(c.emailLabel).getAttribute("type")).toBe("email");
    expect(screen.getByLabelText(c.emailLabel).getAttribute("autocomplete")).toBe("email");
    expect(screen.getByLabelText(c.passwordLabel).getAttribute("autocomplete")).toBe(
      "new-password",
    );
    for (const input of document.querySelectorAll("input")) {
      expect(input.labels?.length ?? 0).toBeGreaterThan(0);
    }
  });

  test("asks for exactly three fields", () => {
    mount();
    expect(document.querySelectorAll("input").length).toBe(3);
  });

  test("has one h1 and the first step is announced", () => {
    mount();
    expect(document.querySelectorAll("h1").length).toBe(1);
    expect(screen.getByText("Step 1 of 3")).toBeDefined();
  });

  test("an empty submit shows an error summary, marks fields and moves focus", async () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: dictionaries.en.flow.account.submit }));
    const summary = await screen.findByRole("alert");
    await waitFor(() => expect(document.activeElement).toBe(summary));
    const e = dictionaries.en.flow.errors;
    expect(summary.textContent).toContain(e.nameRequired);
    expect(summary.textContent).toContain(e.emailRequired);
    expect(summary.textContent).toContain(e.passwordRequired);
    const name = screen.getByLabelText(dictionaries.en.flow.account.nameLabel);
    expect(name.getAttribute("aria-invalid")).toBe("true");
    const describedBy = name.getAttribute("aria-describedby") ?? "";
    expect(document.getElementById(describedBy)?.textContent).toContain(e.nameRequired);
  });

  test("a summary link moves focus to its field", async () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: dictionaries.en.flow.account.submit }));
    const link = await screen.findByRole("link", {
      name: dictionaries.en.flow.errors.emailRequired,
    });
    fireEvent.click(link);
    expect(document.activeElement?.id).toBe("account-email");
  });

  test("a short password is rejected with a message", async () => {
    mount();
    fillAccount("en", "short");
    fireEvent.click(screen.getByRole("button", { name: dictionaries.en.flow.account.submit }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      dictionaries.en.flow.errors.passwordShort,
    );
  });

  test("the password can be shown and hidden", () => {
    mount();
    const input = screen.getByLabelText(dictionaries.en.flow.account.passwordLabel);
    expect(input.getAttribute("type")).toBe("password");
    fireEvent.click(
      screen.getByRole("button", { name: dictionaries.en.flow.account.showPassword }),
    );
    expect(input.getAttribute("type")).toBe("text");
    expect(
      screen.getByRole("button", { name: dictionaries.en.flow.account.hidePassword }),
    ).toBeDefined();
  });
});

describe("whole flow", () => {
  test("valid details lead to the plan step with Pro preselected, then to done", async () => {
    mount();
    fillAccount();
    fireEvent.click(screen.getByRole("button", { name: dictionaries.en.flow.account.submit }));

    const pro = (await screen.findByRole("radio", { name: /Pro/ })) as HTMLInputElement;
    expect(pro.checked).toBe(true);
    expect(screen.getByText("Step 2 of 3")).toBeDefined();
    expect(screen.getByText("Ana Pérez")).toBeDefined();
    expect(screen.getByText("ana@example.com")).toBeDefined();
    // Prices are always visible, in euros, from integer cents.
    expect(screen.getByText("€19.00 per month")).toBeDefined();
    expect(screen.getByText("€0.00 per month")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: dictionaries.en.flow.plan.submit }));
    expect((await screen.findByRole("status")).textContent).toBe(
      "Welcome, Ana Pérez. Your Pro plan is active.",
    );
    expect(screen.getByText("Step 3 of 3")).toBeDefined();
    expect(document.querySelectorAll("h1").length).toBe(1);
  });

  test("another plan can be chosen and is confirmed", async () => {
    mount("es");
    fillAccount("es");
    fireEvent.click(screen.getByRole("button", { name: dictionaries.es.flow.account.submit }));
    fireEvent.click(await screen.findByRole("radio", { name: /Equipo/ }));
    fireEvent.click(screen.getByRole("button", { name: dictionaries.es.flow.plan.submit }));
    expect((await screen.findByRole("status")).textContent).toBe(
      "Te damos la bienvenida, Ana Pérez. Tu plan Equipo está activo.",
    );
  });

  test("the terms are an inline disclosure, not a modal or a forced checkbox", async () => {
    mount("en", "plan");
    expect(document.querySelector("details.terms")).not.toBeNull();
    expect(document.querySelector("[role=dialog]")).toBeNull();
    expect(document.querySelector("input[type=checkbox]")).toBeNull();
  });
});

describe("steps loaded directly, without any state", () => {
  test("plan renders fully, with the details marked as not entered", () => {
    mount("en", "plan");
    expect(screen.getAllByText(dictionaries.en.flow.plan.notEntered).length).toBe(2);
    expect(screen.getAllByRole("radio").length).toBe(3);
    expect(document.querySelectorAll("h1").length).toBe(1);
  });

  test("submitting the plan without details sends the user back with a message", async () => {
    mount("en", "plan");
    fireEvent.click(screen.getByRole("button", { name: dictionaries.en.flow.plan.submit }));
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain(dictionaries.en.flow.errors.detailsMissing);
    expect(screen.getByText("Step 1 of 3")).toBeDefined();
    await waitFor(() => expect(document.activeElement).toBe(alert));
  });

  test("done shows an honest empty state, not a fake confirmation", () => {
    mount("en", "done");
    expect(screen.getByText(dictionaries.en.flow.done.emptyTitle)).toBeDefined();
    expect(screen.queryByRole("status")).toBeNull();
  });
});

describe("embedding", () => {
  test("uses an h3 so the page keeps a single h1", () => {
    mount("en", "account", "h3");
    expect(document.querySelectorAll("h1").length).toBe(0);
    expect(document.querySelectorAll("h3").length).toBe(1);
  });
});
