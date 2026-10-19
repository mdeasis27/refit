"use client";

import { usePathname } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale } from "@/lib/i18n/locales";

export default function NotFound() {
  const first = (usePathname() ?? "").split("/")[1];
  const locale = isLocale(first) ? first : "en";
  const t = getDictionary(locale).notFound;
  return (
    <main id="main" className="shell">
      <h1>{t.title}</h1>
      <p>{t.body}</p>
      <p>
        <a className="btn" href={`/${locale}/app`}>
          {t.home}
        </a>
      </p>
    </main>
  );
}
