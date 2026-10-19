"use client";

import { type Ref, useEffect, useReducer, useRef, useState } from "react";
import { flowReducer, initialState } from "@/lib/flow/reducer";
import { parseStep, type Step, stepHref } from "@/lib/flow/step";
import { loadState, saveState } from "@/lib/flow/storage";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/locales";
import { AccountStep } from "./AccountStep";
import { DoneStep, isConfirmed } from "./DoneStep";
import { PlanStep } from "./PlanStep";
import { StepProgress } from "./StepProgress";
import "./flow.css";

export type HeadingLevel = "h1" | "h3" | "h4";

interface SignupFlowProps {
  locale: Locale;
  headingLevel: HeadingLevel;
  initialStep: Step;
  /** True on its own page: the step lives in the URL (`?step=`). False when embedded. */
  routed: boolean;
}

function FlowHeading({
  level,
  headingRef,
  children,
}: {
  level: HeadingLevel;
  headingRef: Ref<HTMLHeadingElement>;
  children: string;
}) {
  const Tag = level;
  return (
    <Tag ref={headingRef} id="flow-heading" tabIndex={-1} className="flow-heading">
      {children}
    </Tag>
  );
}

export function SignupFlow({ locale, headingLevel, initialStep, routed }: SignupFlowProps) {
  const t = getDictionary(locale);
  const copy = t.flow;
  const [state, dispatch] = useReducer(flowReducer, initialState);
  const [step, setStep] = useState<Step>(initialStep);
  const [loaded, setLoaded] = useState(false);
  const [missingDetails, setMissingDetails] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const userMoved = useRef(false);

  useEffect(() => {
    dispatch({ type: "load", state: loadState(window.sessionStorage) });
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveState(window.sessionStorage, state);
  }, [state, loaded]);

  useEffect(() => {
    if (!routed) return;
    const onPop = () => {
      userMoved.current = true;
      setStep(parseStep(new URLSearchParams(window.location.search).get("step")));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [routed]);

  useEffect(() => {
    if (routed) document.title = t.meta.redesignTitles[step];
    if (userMoved.current && !missingDetails) headingRef.current?.focus();
  }, [step, routed, t, missingDetails]);

  function goTo(next: Step) {
    userMoved.current = true;
    if (routed) window.history.pushState(null, "", stepHref(window.location.pathname, next));
    setStep(next);
  }

  const title =
    step === "account"
      ? copy.account.title
      : step === "plan"
        ? copy.plan.title
        : isConfirmed(state)
          ? copy.done.title
          : copy.done.emptyTitle;

  return (
    <section className="flow" aria-labelledby="flow-heading">
      <StepProgress current={step} copy={copy} />
      <FlowHeading level={headingLevel} headingRef={headingRef}>
        {title}
      </FlowHeading>
      {step === "account" ? (
        <AccountStep
          copy={copy}
          account={state.account}
          missingDetails={missingDetails}
          onSubmit={(account) => {
            setMissingDetails(false);
            dispatch({ type: "submitAccount", account });
            goTo("plan");
          }}
        />
      ) : null}
      {step === "plan" ? (
        <PlanStep
          locale={locale}
          copy={copy}
          account={state.account}
          plan={state.plan}
          onChoose={(plan) => dispatch({ type: "choosePlan", plan })}
          onEdit={() => goTo("account")}
          onSubmit={() => {
            if (state.account === null) {
              setMissingDetails(true);
              goTo("account");
              return;
            }
            dispatch({ type: "confirm" });
            goTo("done");
          }}
        />
      ) : null}
      {step === "done" ? (
        <DoneStep
          copy={copy}
          state={state}
          onAgain={() => {
            setMissingDetails(false);
            dispatch({ type: "reset" });
            goTo("account");
          }}
        />
      ) : null}
      <p className="hint demo-note">{copy.demoNote}</p>
    </section>
  );
}
