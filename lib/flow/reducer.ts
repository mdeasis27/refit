import { defaultPlan, type PlanId } from "../pricing";

export interface Account {
  readonly name: string;
  readonly email: string;
}

/** The password is never kept: it lives only in the form until the step is submitted. */
export interface FlowState {
  readonly account: Account | null;
  readonly plan: PlanId;
  readonly confirmed: boolean;
}

export type FlowAction =
  | { type: "submitAccount"; account: Account }
  | { type: "choosePlan"; plan: PlanId }
  | { type: "confirm" }
  | { type: "reset" }
  | { type: "load"; state: FlowState };

export const initialState: FlowState = { account: null, plan: defaultPlan, confirmed: false };

/** Pure reducer: always returns a new object, never touches its input. */
export function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case "submitAccount":
      return {
        ...state,
        account: { name: action.account.name.trim(), email: action.account.email.trim() },
        confirmed: false,
      };
    case "choosePlan":
      return { ...state, plan: action.plan, confirmed: false };
    case "confirm":
      return state.account === null ? state : { ...state, confirmed: true };
    case "reset":
      return initialState;
    case "load":
      return action.state;
  }
}
