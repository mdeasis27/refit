import { defaultLocale, isLocale } from "./i18n/locales";

export type RouteDecision =
  | { kind: "next" }
  | { kind: "redirect"; to: string }
  | { kind: "notFound" };

const LOCALE_SHAPED = /^[a-z]{2}(-[A-Za-z]{2})?$/;
const FILE_EXTENSION = /\.[A-Za-z0-9]+$/;
const PASSTHROUGH_PREFIXES = ["/_next", "/api", "/broken"];

function isPassthrough(pathname: string): boolean {
  if (PASSTHROUGH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }
  if (pathname.includes("/opengraph-image")) return true;
  const last = pathname.split("/").pop() ?? "";
  return FILE_EXTENSION.test(last);
}

/** Pure routing table: decides what the proxy does with a request. */
export function resolveRoute(pathname: string, search: string): RouteDecision {
  if (isPassthrough(pathname)) return { kind: "next" };

  const trimmed = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const segments = trimmed.split("/").filter(Boolean);
  const first = segments[0];

  if (first === undefined) {
    return { kind: "redirect", to: `/${defaultLocale}${search}` };
  }
  if (isLocale(first)) {
    if (segments.length === 1) return { kind: "redirect", to: `/${first}/app${search}` };
    return { kind: "next" };
  }
  if (LOCALE_SHAPED.test(first)) return { kind: "notFound" };
  return { kind: "redirect", to: `/${defaultLocale}${trimmed}${search}` };
}
