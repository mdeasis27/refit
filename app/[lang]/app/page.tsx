import { notFound } from "next/navigation";
import { Analogy } from "@/components/story/Analogy";
import { Closing } from "@/components/story/Closing";
import { Compare } from "@/components/story/Compare";
import { Hero } from "@/components/story/Hero";
import { TryIt } from "@/components/story/TryIt";
import { TopBar } from "@/components/TopBar";
import { isLiveMode } from "@/lib/audit/live";
import { isLocale } from "@/lib/i18n/locales";
import { measured } from "@/lib/measure/read";
import "@/components/story/story.css";

/** Provider keys are read per request, so live mode follows the server environment. */
export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <>
      <TopBar locale={lang} />
      <main id="main" className="shell story">
        <Hero locale={lang} />
        <Analogy locale={lang} />
        <TryIt locale={lang} live={isLiveMode(process.env)} />
        <Compare locale={lang} data={measured} />
        <Closing locale={lang} />
      </main>
    </>
  );
}
