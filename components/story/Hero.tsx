import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/locales";

export function Hero({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  return (
    <section aria-labelledby="hero-title" className="story-hero">
      <h1 id="hero-title">{t.meta.siteName}</h1>
      <p className="one-liner">{t.meta.oneLiner}</p>
      <ul className="chips">
        {t.hero.chips.map((chip) => (
          <li key={chip}>{chip}</li>
        ))}
      </ul>
    </section>
  );
}
