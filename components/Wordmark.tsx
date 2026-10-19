import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/locales";

interface WordmarkProps {
  locale: Locale;
  href?: string;
}

/** The "refit" wordmark: lowercase display type with a dashed stitch underneath. */
export function Wordmark({ locale, href }: WordmarkProps) {
  const label = getDictionary(locale).nav.wordmarkLabel;
  const mark = (
    <svg
      role="img"
      aria-label={label}
      width="96"
      height="40"
      viewBox="0 0 96 40"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{label}</title>
      <text
        x="2"
        y="28"
        fontFamily="var(--font-display)"
        fontSize="32"
        fontWeight="800"
        fill="currentColor"
        letterSpacing="-1"
      >
        refit
      </text>
      <path
        d="M3 35 H93"
        stroke="var(--thread)"
        strokeWidth="3"
        strokeDasharray="8 6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
  if (!href) return <span className="wordmark">{mark}</span>;
  return (
    <a className="wordmark" href={href}>
      {mark}
    </a>
  );
}
