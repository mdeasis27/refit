import type { HTMLInputAutoCompleteAttribute, ReactNode } from "react";

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "password";
  autoComplete: HTMLInputAutoCompleteAttribute;
  hint?: string;
  error?: string;
  /** Extra control shown under the input, for example the show password button. */
  extra?: ReactNode;
}

/** A labelled text input with an optional hint and error, both linked with aria-describedby. */
export function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  hint,
  error,
  extra,
}: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {hint ? (
        <p id={hintId} className="hint">
          {hint}
        </p>
      ) : null}
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        autoCapitalize="none"
        spellCheck={false}
        required
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
      {error ? (
        <p id={errorId} className="error-text">
          <span aria-hidden="true">⚠ </span>
          {error}
        </p>
      ) : null}
      {extra}
    </div>
  );
}
