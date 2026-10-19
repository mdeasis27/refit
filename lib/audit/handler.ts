import { z } from "zod";
import type { ChatOptions, ChatResponse } from "@/ai-kit/types";
import { locales } from "@/lib/i18n/locales";
import {
  buildAuditPrompt,
  type FlowSources,
  isLiveMode,
  ModelOutputError,
  parseModelAudit,
} from "./live";
import type { AuditView } from "./schema";

export const AUDIT_LIMIT_PER_HOUR = 5;
/** Total cap across all addresses, so spoofed addresses cannot run up the bill. */
export const AUDIT_GLOBAL_LIMIT_PER_HOUR = 60;
const REQUEST_TIMEOUT_MS = 45_000;

export type AuditErrorCode =
  | "not-live"
  | "bad-request"
  | "rate-limited"
  | "provider-failed"
  | "bad-output";

export interface LiveAuditData {
  entries: AuditView[];
  provider: string;
  model: string;
  latency_ms: number;
}

/** The API envelope: success flag, nullable data, nullable error code. */
export type AuditEnvelope =
  | { ok: true; data: LiveAuditData; error: null }
  | { ok: false; data: null; error: AuditErrorCode };

export interface AuditResult {
  status: number;
  body: AuditEnvelope;
  retryAfterSeconds?: number;
}

export interface AuditDeps {
  env: Readonly<Record<string, string | undefined>>;
  ip: string;
  body: unknown;
  readSources: () => Promise<FlowSources>;
  chat: (options: ChatOptions) => Promise<ChatResponse>;
  rateLimit: (
    key: string,
    config: { maxRequests: number },
  ) => { allowed: boolean; retryAfterSeconds?: number };
  log: (message: string, error: unknown) => void;
}

const requestSchema = z.object({ locale: z.enum(locales) });

const fail = (status: number, error: AuditErrorCode, retryAfterSeconds?: number): AuditResult => ({
  status,
  body: { ok: false, data: null, error },
  retryAfterSeconds,
});

/** The whole live audit request, with every outside effect injected so it can be tested. */
export async function handleAudit(deps: AuditDeps): Promise<AuditResult> {
  if (!isLiveMode(deps.env)) return fail(404, "not-live");

  const request = requestSchema.safeParse(deps.body);
  if (!request.success) return fail(400, "bad-request");

  const limit = deps.rateLimit(`audit:${deps.ip}`, { maxRequests: AUDIT_LIMIT_PER_HOUR });
  if (!limit.allowed) return fail(429, "rate-limited", limit.retryAfterSeconds);
  const total = deps.rateLimit("audit:global", { maxRequests: AUDIT_GLOBAL_LIMIT_PER_HOUR });
  if (!total.allowed) return fail(429, "rate-limited", total.retryAfterSeconds);

  try {
    const sources = await deps.readSources();
    const answer = await deps.chat({
      messages: buildAuditPrompt(sources, request.data.locale),
      maxTokens: 3000,
      temperature: 0.2,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const entries = parseModelAudit(answer.text);
    return {
      status: 200,
      body: {
        ok: true,
        error: null,
        data: {
          entries,
          provider: answer.provider,
          model: answer.model,
          latency_ms: answer.latency_ms,
        },
      },
    };
  } catch (error: unknown) {
    deps.log("live audit failed", error);
    return error instanceof ModelOutputError
      ? fail(502, "bad-output")
      : fail(502, "provider-failed");
  }
}
