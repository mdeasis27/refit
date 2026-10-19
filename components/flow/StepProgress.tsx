import { type Step, stepIndex, steps } from "@/lib/flow/step";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { fill } from "@/lib/i18n/dictionaries";

interface StepProgressProps {
  current: Step;
  copy: Dictionary["flow"];
}

/** "Step 2 of 3" as text, plus the list of steps with the current one marked. */
export function StepProgress({ current, copy }: StepProgressProps) {
  return (
    <div className="progress">
      <p className="progress-text">
        {fill(copy.progress, { current: stepIndex(current), total: steps.length })}
      </p>
      <ol className="progress-list">
        {steps.map((step) => (
          <li key={step} aria-current={step === current ? "step" : undefined}>
            {copy.stepNames[step]}
          </li>
        ))}
      </ol>
    </div>
  );
}
