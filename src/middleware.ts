export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/tiendanube/:path*",
    "/shopify/:path*",
    "/billing/:path*",
    "/stock/:path*",
    "/credits/:path*",
    "/account/:path*",
  ],
};
