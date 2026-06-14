import { NextRequest, NextResponse } from "next/server";

export default function middleware(request: NextRequest) {
  const sessionCookie =
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("__session")?.value;

  const isHomePage = request.nextUrl.pathname === "/";
  const isAuthenticatedPage = request.nextUrl.pathname.startsWith("/dashboard");
  const isAuthPage =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/register") ||
    request.nextUrl.pathname.startsWith("/forgot-password") ||
    request.nextUrl.pathname.startsWith("/reset-password");

  if (isHomePage && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isAuthenticatedPage && !sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && sessionCookie && request.nextUrl.pathname !== "/reset-password") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/login", "/register", "/forgot-password"],
};
