import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/locales";
import { LangSwitch } from "./LangSwitch";
import { Wordmark } from "./Wordmark";

export const PORTFOLIO_BASE = "https://portafolio-mdea.vercel.app";

/** Header: portfolio link first (top-left), then wordmark and language switch. */
export function TopBar({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  return (
    <header className="shell topbar">
      <a className="back" href={`${PORTFOLIO_BASE}/${locale}/projects`}>
        {t.nav.back}
      </a>
      <Wordmark locale={locale} href={`/${locale}/app`} />
      <LangSwitch locale={locale} label={t.nav.langLabel} names={t.nav.langNames} />
    </header>
  );
}
