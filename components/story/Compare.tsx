import { fill, getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/locales";
import { type MeasureData, measureDate } from "@/lib/measure/read";

interface CompareProps {
  locale: Locale;
  /** The output of `bun run measure`. Never typed in by hand. */
  data: MeasureData;
}

interface Row {
  label: string;
  before: number;
  after: number;
}

export function Compare({ locale, data }: CompareProps) {
  const t = getDictionary(locale).compare;
  const rows: Row[] = [
    { label: t.violations, before: data.before.violations, after: data.after.violations },
    { label: t.nodes, before: data.before.nodes, after: data.after.nodes },
    { label: t.screens, before: data.steps.before, after: data.steps.after },
  ];
  return (
    <section aria-labelledby="compare-title" className="story-section">
      <h2 id="compare-title">{t.title}</h2>
      <p>{t.intro}</p>
      <table className="numbers">
        <caption>{t.caption}</caption>
        <thead>
          <tr>
            <th scope="col">{t.metric}</th>
            <th scope="col">{t.before}</th>
            <th scope="col">{t.after}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              <td data-metric="before">{row.before}</td>
              <td data-metric="after">
                {row.after}
                {row.before > row.after ? (
                  <span className="delta">
                    {" "}
                    ({fill(t.fewer, { count: row.before - row.after })})
                  </span>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="hint">
        {fill(t.measuredOn, { date: measureDate(data), version: data.axeVersion })} {t.reproduce}
      </p>
    </section>
  );
}
