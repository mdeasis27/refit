import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/locales";

export function Analogy({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).analogy;
  return (
    <section aria-labelledby="analogy-title" className="story-section">
      <h2 id="analogy-title">{t.title}</h2>
      <p>{t.body}</p>
      <h3>{t.glossaryTitle}</h3>
      <dl className="glossary">
        {t.terms.map((item) => (
          <div key={item.term}>
            <dt>{item.term}</dt>
            <dd>{item.definition}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
