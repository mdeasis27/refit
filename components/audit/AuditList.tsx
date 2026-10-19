import type { AuditView } from "@/lib/audit/schema";
import { severities } from "@/lib/audit/schema";
import type { Dictionary } from "@/lib/i18n/dictionaries";

interface AuditListProps {
  views: readonly AuditView[];
  copy: Dictionary["audit"];
  /** Says who wrote the list: the maintainer or a model. Always shown. */
  provenance: string;
}

/** The audit entries, most serious first. Text only: nothing here is ever rendered as HTML. */
export function AuditList({ views, copy, provenance }: AuditListProps) {
  const ordered = [...views].sort(
    (a, b) => severities.indexOf(a.severity) - severities.indexOf(b.severity),
  );
  return (
    <div className="audit">
      <p className="provenance">{provenance}</p>
      <ul className="audit-list">
        {ordered.map((view) => (
          <li key={view.id} className="audit-entry">
            <p className={`severity severity-${view.severity}`}>{copy.severity[view.severity]}</p>
            <h4>{view.title}</h4>
            <dl>
              <div>
                <dt>{copy.whereLabel}</dt>
                <dd>{view.where}</dd>
              </div>
              <div>
                <dt>{copy.breaksLabel}</dt>
                <dd>
                  <ul className="criteria">
                    {view.breaks.map((item) => (
                      <li key={item.label}>
                        {item.url ? (
                          <a href={item.url} target="_blank" rel="noopener noreferrer">
                            {item.label}
                          </a>
                        ) : (
                          item.label
                        )}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
              <div>
                <dt>{copy.fixLabel}</dt>
                <dd>{view.fix}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
