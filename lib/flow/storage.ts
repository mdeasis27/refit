import { z } from "zod";
import { planIds } from "../pricing";
import { type FlowState, initialState } from "./reducer";

export const STORAGE_KEY = "refit:flow:v1";

const stateSchema = z.object({
  account: z.object({ name: z.string().max(200), email: z.string().max(320) }).nullable(),
  plan: z.enum(planIds),
  confirmed: z.boolean(),
});

/** Parses stored text. Anything unexpected falls back to the initial state. */
export function parseStoredState(raw: string | null): FlowState {
  if (raw === null) return initialState;
  try {
    const parsed = stateSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return initialState;
    // A confirmation without an account cannot be real.
    if (parsed.data.confirmed && parsed.data.account === null) return initialState;
    return parsed.data;
  } catch {
    return initialState;
  }
}

export function serializeState(state: FlowState): string {
  return JSON.stringify(state);
}

export function loadState(storage: Pick<Storage, "getItem">): FlowState {
  try {
    return parseStoredState(storage.getItem(STORAGE_KEY));
  } catch {
    return initialState;
  }
}

export function saveState(storage: Pick<Storage, "setItem">, state: FlowState): void {
  try {
    storage.setItem(STORAGE_KEY, serializeState(state));
  } catch {
    // Storage can be full or blocked. The flow still works for this visit.
  }
}
