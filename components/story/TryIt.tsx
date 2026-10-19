import { AuditList } from "@/components/audit/AuditList";
import { LiveAudit } from "@/components/audit/LiveAudit";
import { SignupFlow } from "@/components/flow/SignupFlow";
import { maintainerAudit, toViews } from "@/lib/audit/schema";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/locales";

interface TryItProps {
  locale: Locale;
  /** True when a model provider key is set on the server. */
  live: boolean;
}

export function TryIt({ locale, live }: TryItProps) {
  const t = getDictionary(locale);
  return (
    <section aria-labelledby="try-title" className="story-section">
      <h2 id="try-title">{t.tryIt.title}</h2>
      <p>{t.tryIt.intro}</p>
      <div className="compare-grid">
        <div className="panel">
          <h3>{t.tryIt.beforeTitle}</h3>
          <p>{t.tryIt.beforeNote}</p>
          <iframe
            className="old-flow"
            title={t.tryIt.beforeFrameTitle}
            src="/broken/index.html"
            loading="lazy"
          />
          <p>
            <a href="/broken/index.html" target="_blank" rel="noopener noreferrer">
              {t.tryIt.openBefore}
            </a>
          </p>
        </div>
        <div className="panel">
          <h3>{t.tryIt.afterTitle}</h3>
          <p>{t.tryIt.afterNote}</p>
          <SignupFlow locale={locale} headingLevel="h4" initialStep="account" routed={false} />
          <p>
            <a href={`/${locale}/redesign`}>{t.tryIt.openAfter}</a>
          </p>
        </div>
      </div>
      <h3>{t.audit.title}</h3>
      <p>{t.audit.intro}</p>
      <AuditList
        views={toViews(maintainerAudit, locale)}
        copy={t.audit}
        provenance={t.audit.provenanceDemo}
      />
      {live ? <LiveAudit locale={locale} /> : null}
    </section>
  );
}
