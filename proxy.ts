import { type NextRequest, NextResponse } from "next/server";
import { resolveRoute } from "./lib/routing";

const NOT_FOUND_HTML =
  '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>404</title></head>' +
  '<body><main><h1>404</h1><p><a href="/en/app">Refit</a></p></main></body></html>';

export function proxy(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;
  const decision = resolveRoute(pathname, search);

  if (decision.kind === "redirect") {
    return NextResponse.redirect(new URL(decision.to, request.url), 307);
  }
  if (decision.kind === "notFound") {
    return new NextResponse(NOT_FOUND_HTML, {
      status: 404,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
