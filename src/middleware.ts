import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPrefixes = ["/dashboard"];

export function middleware(request: NextRequest) {
  const sessionCookie =
    request.cookies.get("better-auth.session_token") ||
    request.cookies.get("__Secure-better-auth.session_token");
  const isProtected = protectedPrefixes.some(p => request.nextUrl.pathname.startsWith(p));

  if (isProtected && !sessionCookie) {
    const url = new URL("/", request.url);
    url.searchParams.set("returnTo", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
