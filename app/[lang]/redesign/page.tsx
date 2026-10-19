import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SignupFlow } from "@/components/flow/SignupFlow";
import { TopBar } from "@/components/TopBar";
import { parseStep } from "@/lib/flow/step";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale } from "@/lib/i18n/locales";

interface RedesignProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params, searchParams }: RedesignProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const step = parseStep((await searchParams).step);
  return {
    title: getDictionary(lang).meta.redesignTitles[step],
    alternates: { languages: { en: "/en/redesign", es: "/es/redesign" } },
  };
}

export default async function RedesignPage({ params, searchParams }: RedesignProps) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const step = parseStep((await searchParams).step);
  return (
    <>
      <TopBar locale={lang} />
      <main id="main" className="shell">
        <SignupFlow locale={lang} headingLevel="h1" initialStep={step} routed />
      </main>
    </>
  );
}
