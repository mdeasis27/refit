import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { rateLimit } from "@/ai-kit/rate-limit";
import { chat } from "@/ai-kit/router";
import { type AuditEnvelope, handleAudit } from "@/lib/audit/handler";

export const dynamic = "force-dynamic";

const MAX_BODY_CHARS = 1024;
const FLOW_DIR = join(process.cwd(), "broken");

async function readSources() {
  const [html, css, js] = await Promise.all(
    ["index.html", "style.css", "app.js"].map((name) => readFile(join(FLOW_DIR, name), "utf8")),
  );
  return { html: html ?? "", css: css ?? "", js: js ?? "" };
}

async function readBody(request: Request): Promise<unknown> {
  try {
    const text = await request.text();
    return text.length > MAX_BODY_CHARS ? undefined : JSON.parse(text);
  } catch {
    return undefined;
  }
}

/** Only used to key the rate limit. */
function clientKey(request: Request): string {
  // The last entry is the one a trusted proxy appended; earlier ones come from the client.
  const parts = (request.headers.get("x-forwarded-for") ?? "").split(",");
  return parts[parts.length - 1]?.trim() || "unknown";
}

export async function POST(request: Request): Promise<Response> {
  const result = await handleAudit({
    env: process.env,
    ip: clientKey(request),
    body: await readBody(request),
    readSources,
    chat,
    rateLimit,
    log: (message, error) =>
      console.error(`[audit] ${message}`, error instanceof Error ? error.name : "error"),
  });
  const headers = new Headers({ "cache-control": "no-store" });
  if (result.retryAfterSeconds !== undefined) {
    headers.set("retry-after", String(result.retryAfterSeconds));
  }
  return Response.json(result.body satisfies AuditEnvelope, { status: result.status, headers });
}
