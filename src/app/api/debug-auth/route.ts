import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    secret_set: !!process.env.NEXTAUTH_SECRET,
    nextauth_url: process.env.NEXTAUTH_URL ?? "(no seteado)",
    db_set: !!process.env.DATABASE_URL,
    node_env: process.env.NODE_ENV,
    vercel_url: process.env.VERCEL_URL ?? "(no disponible)",
  });
}
