import type { Metadata } from "next";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, locales } from "@/lib/i18n/locales";
import "../globals.css";

const bricolage = localFont({
  src: "../fonts/bricolage.woff2",
  variable: "--font-bricolage",
  weight: "200 800",
  display: "swap",
});
const atkinson = localFont({
  src: [
    { path: "../fonts/atkinson-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/atkinson-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-atkinson",
  display: "swap",
});
const jetbrains = localFont({
  src: "../fonts/jetbrains-mono.woff2",
  variable: "--font-jetbrains",
  weight: "100 800",
  display: "swap",
});

export const dynamicParams = false;

function siteUrl(): URL {
  try {
    return new URL(process.env.SITE_URL ?? "http://localhost:3000");
  } catch {
    return new URL("http://localhost:3000");
  }
}

export function generateStaticParams(): Array<{ lang: string }> {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getDictionary(lang);
  return {
    metadataBase: siteUrl(),
    title: t.meta.appTitle,
    description: t.meta.appDescription,
    alternates: { languages: { en: "/en/app", es: "/es/app" } },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  return (
    <html
      lang={lang}
      className={`${bricolage.variable} ${atkinson.variable} ${jetbrains.variable}`}
    >
      <body>
        <a className="skip-link" href="#main">
          {t.nav.skip}
        </a>
        {children}
      </body>
    </html>
  );
}
