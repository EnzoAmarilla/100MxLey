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
  "/logistics",
  "/integrations",
];

const AUTH_PAGES = ["/login", "/register"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const isSuperAdminRoute = pathname === "/superadmin" || pathname.startsWith("/superadmin/");
  const isAdminRoute      = pathname === "/admin"       || pathname.startsWith("/admin/");
  const isClientRoute     = CLIENT_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const isAuthPage        = AUTH_PAGES.includes(pathname);

  // /superadmin: only SUPERADMIN
  if (isSuperAdminRoute) {
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    if (token.role !== "SUPERADMIN") {
      const url = req.nextUrl.clone();
      url.pathname = token.role === "ADMIN" ? "/admin" : "/dashboard";
      url.search   = "";
      return NextResponse.redirect(url);
    }
  }

  // /admin: only SUPERADMIN and ADMIN
  if (isAdminRoute) {
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    if (token.role !== "ADMIN" && token.role !== "SUPERADMIN") {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search   = "";
      return NextResponse.redirect(url);
    }
  }

  // Client routes: must be authenticated; redirect privileged roles to their panels
  if (isClientRoute) {
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    if (pathname === "/dashboard") {
      if (token.role === "SUPERADMIN") {
        const url = req.nextUrl.clone();
        url.pathname = "/superadmin";
        url.search   = "";
        return NextResponse.redirect(url);
      }
      if (token.role === "ADMIN") {
        const url = req.nextUrl.clone();
        url.pathname = "/admin";
        url.search   = "";
        return NextResponse.redirect(url);
      }
    }
  }

  // Auth pages: redirect logged-in users to their panel
  if (isAuthPage && token) {
    const url = req.nextUrl.clone();
    if (token.role === "SUPERADMIN") url.pathname = "/superadmin";
    else if (token.role === "ADMIN")  url.pathname = "/admin";
    else                              url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/superadmin/:path*",
    "/admin/:path*",
    "/dashboard/:path*",
    "/tiendanube/:path*",
    "/shopify/:path*",
    "/billing/:path*",
    "/stock/:path*",
    "/credits/:path*",
    "/account/:path*",
    "/logistics/:path*",
    "/integrations/:path*",
    "/login",
    "/register",
  ],
};
