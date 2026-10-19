import type { Ref } from "react";

export interface ErrorItem {
  /** Id of the input the message belongs to. Missing for messages without a field. */
  fieldId?: string;
  message: string;
}

interface ErrorSummaryProps {
  title: string;
  intro?: string;
  items: readonly ErrorItem[];
  summaryRef: Ref<HTMLDivElement>;
}

/** Announced and focused when a submit fails. Each item moves focus to its field. */
export function ErrorSummary({ title, intro, items, summaryRef }: ErrorSummaryProps) {
  const hasLinks = items.some((item) => item.fieldId);
  return (
    <div ref={summaryRef} role="alert" tabIndex={-1} className="error-summary">
      <p className="error-summary-title">
        <span aria-hidden="true">⚠ </span>
        {title}
      </p>
      {intro && hasLinks ? <p className="hint">{intro}</p> : null}
      <ul>
        {items.map((item) => (
          <li key={item.fieldId ?? item.message}>
            {item.fieldId ? (
              <a
                href={`#${item.fieldId}`}
                onClick={(event) => {
                  event.preventDefault();
                  document.getElementById(item.fieldId ?? "")?.focus();
                }}
              >
                {item.message}
              </a>
            ) : (
              item.message
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
