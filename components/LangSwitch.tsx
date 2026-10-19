"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { type Locale, locales } from "@/lib/i18n/locales";

interface LangSwitchProps {
  locale: Locale;
  label: string;
  names: Dictionary["nav"]["langNames"];
}

function hrefFor(target: Locale, pathname: string, search: string): string {
  const rest = pathname.replace(/^\/(en|es)(?=\/|$)/, "");
  return `/${target}${rest}${search}`;
}

function Links({ locale, label, names }: LangSwitchProps) {
  const pathname = usePathname() ?? `/${locale}/app`;
  const params = useSearchParams();
  const query = params?.toString() ?? "";
  const search = query ? `?${query}` : "";
  return (
    <nav aria-label={label}>
      <ul className="lang-switch">
        {locales.map((target) => (
          <li key={target}>
            <a
              href={hrefFor(target, pathname, search)}
              lang={target}
              hrefLang={target}
              aria-current={target === locale ? "true" : undefined}
            >
              <span aria-hidden="true">{target.toUpperCase()}</span>
              <span className="visually-hidden">{names[target]}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** EN/ES switch: same page, other language, query string kept. */
export function LangSwitch(props: LangSwitchProps) {
  return (
    <Suspense
      fallback={
        <nav aria-label={props.label}>
          <ul className="lang-switch">
            {locales.map((target) => (
              <li key={target}>
                <a
                  href={`/${target}/app`}
                  lang={target}
                  aria-current={target === props.locale ? "true" : undefined}
                >
                  <span aria-hidden="true">{target.toUpperCase()}</span>
                  <span className="visually-hidden">{props.names[target]}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      }
    >
      <Links {...props} />
    </Suspense>
  );
}
