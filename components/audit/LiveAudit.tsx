"use client";

import { useState } from "react";
import type { AuditEnvelope, LiveAuditData } from "@/lib/audit/handler";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/locales";
import { AuditList } from "./AuditList";

interface LiveAuditProps {
  locale: Locale;
}

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "failed" }
  | { kind: "done"; data: LiveAuditData };

function isEnvelope(value: unknown): value is AuditEnvelope {
  return typeof value === "object" && value !== null && "ok" in value && "error" in value;
}

/** Only rendered when the server says a model is configured. Asks for a model audit on demand. */
export function LiveAudit({ locale }: LiveAuditProps) {
  const copy = getDictionary(locale).audit;
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function run() {
    setStatus({ kind: "loading" });
    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      const body: unknown = await response.json();
      if (isEnvelope(body) && body.ok) setStatus({ kind: "done", data: body.data });
      else setStatus({ kind: "failed" });
    } catch {
      setStatus({ kind: "failed" });
    }
  }

  return (
    <div className="live-audit">
      <p className="hint">{copy.liveAvailable}</p>
      <button
        type="button"
        className="btn secondary"
        onClick={run}
        disabled={status.kind === "loading"}
        aria-busy={status.kind === "loading"}
      >
        {status.kind === "loading" ? copy.running : copy.runButton}
      </button>
      <div role="status">
        {status.kind === "failed" ? <p className="error-text">{copy.failed}</p> : null}
      </div>
      {status.kind === "done" ? (
        <>
          <p className="hint">
            {copy.modelBadgeLabel} {status.data.provider}, {status.data.model},{" "}
            {status.data.latency_ms} ms
          </p>
          <AuditList views={status.data.entries} copy={copy} provenance={copy.provenanceLive} />
        </>
      ) : null}
    </div>
  );
}
