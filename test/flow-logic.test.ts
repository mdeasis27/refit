import { describe, expect, test } from "bun:test";
import type { FlowState } from "../lib/flow/reducer";
import { flowReducer, initialState } from "../lib/flow/reducer";
import { parseStep, stepHref, stepIndex } from "../lib/flow/step";
import { loadState, parseStoredState, STORAGE_KEY, saveState } from "../lib/flow/storage";
import { defaultPlan, formatPrice, plans } from "../lib/pricing";
import { hasErrors, validateAccount } from "../lib/signup/validate";

const nbsp = (text: string) => text.replace(/ /g, " ");

describe("pricing", () => {
  test("prices are integer cents", () => {
    for (const plan of plans) expect(Number.isInteger(plan.priceCents)).toBe(true);
    expect(plans.map((p) => p.priceCents)).toEqual([0, 1900, 4900]);
  });
  test("Pro is the default plan", () => {
    expect(defaultPlan).toBe("pro");
  });
  test("formats in English and Spanish", () => {
    expect(formatPrice(1900, "en")).toBe("€19.00");
    expect(nbsp(formatPrice(1900, "es"))).toBe("19,00 €");
    expect(formatPrice(0, "en")).toBe("€0.00");
    expect(formatPrice(4905, "en")).toBe("€49.05");
  });
  test("rejects floats and negatives", () => {
    expect(() => formatPrice(19.5, "en")).toThrow(RangeError);
    expect(() => formatPrice(-1, "en")).toThrow(RangeError);
    expect(() => formatPrice(Number.NaN, "en")).toThrow(RangeError);
  });
});

describe("validateAccount", () => {
  const good = { name: "Ana", email: "ana@example.com", password: "12345678" };
  test("accepts valid input", () => {
    expect(validateAccount(good)).toEqual({});
    expect(hasErrors(validateAccount(good))).toBe(false);
  });
  test("reports every empty field", () => {
    expect(validateAccount({ name: " ", email: "", password: "" })).toEqual({
      name: "nameRequired",
      email: "emailRequired",
      password: "passwordRequired",
    });
  });
  test.each(["ana", "ana@", "@example.com", "ana@example", "a b@example.com"])(
    "rejects email %p",
    (email) => {
      expect(validateAccount({ ...good, email }).email).toBe("emailFormat");
    },
  );
  test("trims the email before checking", () => {
    expect(validateAccount({ ...good, email: "  ana@example.com " })).toEqual({});
  });
  test("password needs 8 characters and nothing else", () => {
    expect(validateAccount({ ...good, password: "1234567" }).password).toBe("passwordShort");
    expect(validateAccount({ ...good, password: "aaaaaaaa" })).toEqual({});
    expect(validateAccount({ ...good, password: "        " })).toEqual({});
  });
  test("counts characters, not UTF-16 units", () => {
    expect(validateAccount({ ...good, password: "😀😀😀😀😀😀😀" }).password).toBe("passwordShort");
    expect(validateAccount({ ...good, password: "😀😀😀😀😀😀😀😀" })).toEqual({});
  });
});

describe("flowReducer", () => {
  test("starts with Pro selected and no account", () => {
    expect(initialState).toEqual({ account: null, plan: "pro", confirmed: false });
  });
  test("does not mutate the previous state", () => {
    const frozen: FlowState = Object.freeze({ ...initialState });
    const next = flowReducer(frozen, {
      type: "submitAccount",
      account: { name: " Ana ", email: " a@b.co " },
    });
    expect(next).not.toBe(frozen);
    expect(frozen.account).toBeNull();
    expect(next.account).toEqual({ name: "Ana", email: "a@b.co" });
  });
  test("choosing a plan clears a confirmation", () => {
    const confirmed: FlowState = {
      account: { name: "A", email: "a@b.co" },
      plan: "pro",
      confirmed: true,
    };
    expect(flowReducer(confirmed, { type: "choosePlan", plan: "team" })).toEqual({
      account: { name: "A", email: "a@b.co" },
      plan: "team",
      confirmed: false,
    });
  });
  test("cannot confirm without an account", () => {
    expect(flowReducer(initialState, { type: "confirm" })).toBe(initialState);
  });
  test("confirm and reset", () => {
    const withAccount = flowReducer(initialState, {
      type: "submitAccount",
      account: { name: "A", email: "a@b.co" },
    });
    const done = flowReducer(withAccount, { type: "confirm" });
    expect(done.confirmed).toBe(true);
    expect(flowReducer(done, { type: "reset" })).toEqual(initialState);
  });
});

describe("storage", () => {
  const valid: FlowState = {
    account: { name: "Ana", email: "a@b.co" },
    plan: "team",
    confirmed: true,
  };
  test("round trips a valid state", () => {
    const store = new Map<string, string>();
    saveState({ setItem: (k, v) => void store.set(k, v) }, valid);
    expect(store.has(STORAGE_KEY)).toBe(true);
    expect(loadState({ getItem: (k) => store.get(k) ?? null })).toEqual(valid);
  });
  test.each([
    ["null", null],
    ["garbage", "{not json"],
    ["wrong shape", '{"account":1}'],
    ["unknown plan", '{"account":null,"plan":"gold","confirmed":false}'],
    ["confirmed without account", '{"account":null,"plan":"pro","confirmed":true}'],
  ])("falls back to the initial state on %s", (_label, raw) => {
    expect(parseStoredState(raw)).toEqual(initialState);
  });
  test("survives a throwing storage", () => {
    const broken = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("full");
      },
    };
    expect(loadState(broken)).toEqual(initialState);
    expect(() => saveState(broken, valid)).not.toThrow();
  });
});

describe("step", () => {
  test("unknown or missing values mean the first step", () => {
    expect(parseStep(undefined)).toBe("account");
    expect(parseStep("nope")).toBe("account");
    expect(parseStep(["plan", "done"])).toBe("plan");
    expect(parseStep("done")).toBe("done");
    expect(parseStep(null)).toBe("account");
  });
  test("indexes and hrefs", () => {
    expect(stepIndex("account")).toBe(1);
    expect(stepIndex("done")).toBe(3);
    expect(stepHref("/en/redesign", "account")).toBe("/en/redesign");
    expect(stepHref("/en/redesign", "plan")).toBe("/en/redesign?step=plan");
  });
});
