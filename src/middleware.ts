import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const CLIENT_PREFIXES = [
  "/dashboard",
  "/tiendanube",
  "/shopify",
  "/billing",
  "/stock",
  "/credits",
  "/account",
];

const AUTH_PAGES = ["/login", "/register"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const isSuperAdminRoute = pathname === "/superadmin" || pathname.startsWith("/superadmin/");
  const isClientRoute     = CLIENT_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const isAuthPage        = AUTH_PAGES.includes(pathname);

  // /superadmin: must be authenticated AND have SUPERADMIN role
  if (isSuperAdminRoute) {
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    if (token.role !== "SUPERADMIN") {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search   = "";
      return NextResponse.redirect(url);
    }
  }

  // Client routes: must be authenticated
  if (isClientRoute && !token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // Auth pages: redirect logged-in users to appropriate panel
  if (isAuthPage && token) {
    const url = req.nextUrl.clone();
    url.pathname = token.role === "SUPERADMIN" ? "/superadmin" : "/dashboard";
    url.search   = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/superadmin/:path*",
    "/dashboard/:path*",
    "/tiendanube/:path*",
    "/shopify/:path*",
    "/billing/:path*",
    "/stock/:path*",
    "/credits/:path*",
    "/account/:path*",
    "/login",
    "/register",
  ],
};
