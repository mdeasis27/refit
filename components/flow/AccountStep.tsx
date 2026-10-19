"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import type { Account } from "@/lib/flow/reducer";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import {
  type ErrorCode,
  type FieldErrors,
  type FieldName,
  fieldOrder,
  hasErrors,
  validateAccount,
} from "@/lib/signup/validate";
import { ErrorSummary } from "./ErrorSummary";
import { Field } from "./Field";

interface AccountStepProps {
  copy: Dictionary["flow"];
  account: Account | null;
  /** True when the user reached the plan step without details and was sent back here. */
  missingDetails: boolean;
  onSubmit: (account: Account) => void;
}

const FIELD_IDS: Record<FieldName, string> = {
  name: "account-name",
  email: "account-email",
  password: "account-password",
};

export function AccountStep({ copy, account, missingDetails, onSubmit }: AccountStepProps) {
  const [name, setName] = useState(account?.name ?? "");
  const [email, setEmail] = useState(account?.email ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [attempt, setAttempt] = useState(0);
  const summaryRef = useRef<HTMLDivElement>(null);

  // Details are restored from the session after the first render.
  useEffect(() => {
    if (account) {
      setName(account.name);
      setEmail(account.email);
    }
  }, [account]);

  const showSummary = attempt > 0 || missingDetails;
  useEffect(() => {
    if (attempt > 0 || missingDetails) summaryRef.current?.focus();
  }, [attempt, missingDetails]);

  const messageFor = (code: ErrorCode | undefined): string | undefined =>
    code ? copy.errors[code] : undefined;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validateAccount({ name, email, password });
    setErrors(found);
    if (hasErrors(found)) {
      setAttempt((count) => count + 1);
      return;
    }
    onSubmit({ name, email });
  }

  const items = fieldOrder.flatMap((field) => {
    const message = messageFor(errors[field]);
    return message ? [{ fieldId: FIELD_IDS[field], message }] : [];
  });
  const summaryItems =
    items.length > 0 ? items : missingDetails ? [{ message: copy.errors.detailsMissing }] : [];

  return (
    <form noValidate onSubmit={handleSubmit} className="flow-form">
      <p className="lead">{copy.account.intro}</p>
      {showSummary && summaryItems.length > 0 ? (
        <ErrorSummary
          summaryRef={summaryRef}
          title={copy.errors.summaryTitle}
          intro={copy.errors.summaryIntro}
          items={summaryItems}
        />
      ) : null}
      <Field
        id={FIELD_IDS.name}
        label={copy.account.nameLabel}
        value={name}
        onChange={setName}
        autoComplete="name"
        error={messageFor(errors.name)}
      />
      <Field
        id={FIELD_IDS.email}
        label={copy.account.emailLabel}
        type="email"
        value={email}
        onChange={setEmail}
        autoComplete="email"
        error={messageFor(errors.email)}
      />
      <Field
        id={FIELD_IDS.password}
        label={copy.account.passwordLabel}
        type={showPassword ? "text" : "password"}
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        hint={copy.account.passwordHint}
        error={messageFor(errors.password)}
        extra={
          <button
            type="button"
            className="btn secondary small"
            onClick={() => setShowPassword((shown) => !shown)}
          >
            {showPassword ? copy.account.hidePassword : copy.account.showPassword}
          </button>
        }
      />
      <button type="submit" className="btn">
        {copy.account.submit}
      </button>
    </form>
  );
}
