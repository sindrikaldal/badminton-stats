import { NextResponse, type NextRequest } from "next/server";
import { GATE_COOKIE } from "@/lib/gate";

/**
 * A shared group code, not authentication. It keeps the URL from being useful
 * to a stranger who stumbles on it; everyone inside is trusted equally.
 */
export function proxy(request: NextRequest) {
  const hasCode = request.cookies.get(GATE_COOKIE)?.value === "ok";
  const isGate = request.nextUrl.pathname === "/inn";

  if (!hasCode && !isGate) {
    const url = request.nextUrl.clone();
    url.pathname = "/inn";
    url.searchParams.set("naest", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (hasCode && isGate) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|icon|apple-icon|manifest.webmanifest|favicon.ico).*)",
  ],
};
