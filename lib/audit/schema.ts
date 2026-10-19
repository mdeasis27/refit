import { z } from "zod";
import auditJson from "@/data/audit.json";
import type { Locale } from "@/lib/i18n/locales";

const localized = z.object({ en: z.string().min(1), es: z.string().min(1) });

export const severities = ["blocker", "major", "minor"] as const;
export type Severity = (typeof severities)[number];

const criterionSchema = z.object({
  kind: z.enum(["wcag", "heuristic"]),
  ref: z.string().min(1),
  name: localized,
  url: z.url().optional(),
});

const entrySchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  severity: z.enum(severities),
  title: localized,
  where: localized,
  breaks: z.array(z.string()).min(1),
  axeRules: z.array(z.string()),
  fix: localized,
});

export const maintainerAuditSchema = z
  .object({
    author: z.literal("maintainer"),
    criteria: z.record(z.string(), criterionSchema),
    entries: z.array(entrySchema).min(1),
  })
  .superRefine((audit, ctx) => {
    for (const entry of audit.entries) {
      for (const key of entry.breaks) {
        if (!(key in audit.criteria)) {
          ctx.addIssue({
            code: "custom",
            message: `Entry ${entry.id} points to unknown criterion ${key}`,
          });
        }
      }
    }
    const ids = audit.entries.map((entry) => entry.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: "custom", message: "Audit entry ids must be unique" });
    }
  });

export type MaintainerAudit = z.infer<typeof maintainerAuditSchema>;

/** What the UI shows, whether the entry was written by hand or came from a model. */
export interface AuditView {
  id: string;
  severity: Severity;
  title: string;
  where: string;
  fix: string;
  breaks: ReadonlyArray<{ kind: "wcag" | "heuristic"; label: string; url?: string }>;
}

export function parseMaintainerAudit(input: unknown): MaintainerAudit {
  return maintainerAuditSchema.parse(input);
}

export function toViews(audit: MaintainerAudit, locale: Locale): AuditView[] {
  return audit.entries.map((entry) => ({
    id: entry.id,
    severity: entry.severity,
    title: entry.title[locale],
    where: entry.where[locale],
    fix: entry.fix[locale],
    breaks: entry.breaks.flatMap((key) => {
      const criterion = audit.criteria[key];
      if (!criterion) return [];
      const label =
        criterion.kind === "wcag"
          ? `WCAG ${criterion.ref} ${criterion.name[locale]}`
          : criterion.name[locale];
      return [{ kind: criterion.kind, label, url: criterion.url }];
    }),
  }));
}

/** The committed audit, validated once when the module loads. */
export const maintainerAudit: MaintainerAudit = parseMaintainerAudit(auditJson);
