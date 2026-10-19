"use client";

import type { FormEvent } from "react";
import type { Account } from "@/lib/flow/reducer";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/locales";
import { formatPrice, type PlanId, plans } from "@/lib/pricing";

interface PlanStepProps {
  locale: Locale;
  copy: Dictionary["flow"];
  account: Account | null;
  plan: PlanId;
  onChoose: (plan: PlanId) => void;
  onEdit: () => void;
  onSubmit: () => void;
}

export function PlanStep({
  locale,
  copy,
  account,
  plan,
  onChoose,
  onEdit,
  onSubmit,
}: PlanStepProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="flow-form">
      <fieldset className="plans">
        <legend>{copy.plan.legend}</legend>
        {plans.map((option) => {
          const text = copy.plan[option.id];
          return (
            <label key={option.id} className="plan-option">
              <input
                type="radio"
                name="plan"
                value={option.id}
                checked={plan === option.id}
                onChange={() => onChoose(option.id)}
              />
              <span className="plan-name">{text.name}</span>
              <span className="plan-blurb">{text.blurb}</span>
              <span className="plan-price">
                {formatPrice(option.priceCents, locale)} {copy.plan.perMonth}
              </span>
            </label>
          );
        })}
      </fieldset>

      <dl className="summary">
        <div>
          <dt>{copy.plan.summaryName}</dt>
          <dd>{account?.name ?? copy.plan.notEntered}</dd>
        </div>
        <div>
          <dt>{copy.plan.summaryEmail}</dt>
          <dd>{account?.email ?? copy.plan.notEntered}</dd>
        </div>
      </dl>
      <button type="button" className="btn secondary" onClick={onEdit}>
        {copy.plan.edit}
      </button>

      <details className="terms">
        <summary>{copy.plan.termsToggle}</summary>
        <p>{copy.plan.termsBody}</p>
      </details>
      <p>{copy.plan.consent}</p>
      <button type="submit" className="btn">
        {copy.plan.submit}
      </button>
    </form>
  );
}
