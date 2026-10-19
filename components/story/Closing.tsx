import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/locales";

export const SOURCE_URL = "https://github.com/mdeasis27/refit";

export function WhereItFits({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).fits;
  return (
    <section aria-labelledby="fits-title" className="story-section">
      <h2 id="fits-title">{t.title}</h2>
      <div className="fits-grid">
        <div>
          <h3>{t.worthTitle}</h3>
          <ul>
            {t.worth.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>{t.notTitle}</h3>
          <ul>
            {t.not.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function WhatItProves({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).proves;
  return (
    <section aria-labelledby="proves-title" className="story-section">
      <h2 id="proves-title">{t.title}</h2>
      {t.paragraphs.map((text) => (
        <p key={text}>{text}</p>
      ))}
    </section>
  );
}

/** A native, collapsed disclosure. It is the last thing on the page. */
function ForEngineers({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).engineers;
  return (
    <details className="engineers">
      <summary>{t.summary}</summary>
      <h3>{t.mechanismTitle}</h3>
      <ul>
        {t.mechanism.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <h3>{t.testingTitle}</h3>
      <ul>
        {t.testing.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className="stack">{t.stackLine}</p>
      <p>
        <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer">
          {t.sourceLink}
        </a>
      </p>
    </details>
  );
}

/** The closing sections, in order: where it fits, what it proves, then the engineers disclosure. */
export function Closing({ locale }: { locale: Locale }) {
  return (
    <>
      <WhereItFits locale={locale} />
      <WhatItProves locale={locale} />
      <ForEngineers locale={locale} />
    </>
  );
}
