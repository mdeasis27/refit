import type { FlowState } from "@/lib/flow/reducer";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { fill } from "@/lib/i18n/dictionaries";

interface DoneStepProps {
  copy: Dictionary["flow"];
  state: FlowState;
  onAgain: () => void;
}

/** True when there is a real confirmation to show. */
export function isConfirmed(state: FlowState): boolean {
  return state.confirmed && state.account !== null;
}

export function DoneStep({ copy, state, onAgain }: DoneStepProps) {
  if (!isConfirmed(state) || state.account === null) {
    return (
      <div className="flow-form">
        <p>{copy.done.emptyBody}</p>
        <button type="button" className="btn" onClick={onAgain}>
          {copy.done.start}
        </button>
      </div>
    );
  }
  return (
    <div className="flow-form">
      <p role="status" className="lead">
        {fill(copy.done.message, { name: state.account.name, plan: copy.plan[state.plan].name })}
      </p>
      <button type="button" className="btn secondary" onClick={onAgain}>
        {copy.done.again}
      </button>
    </div>
  );
}
