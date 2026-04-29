export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.EMAIL_FROM ?? "100Mxley <onboarding@resend.dev>";
const BASE   = (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");

const TOKEN_TTL_HOURS = 1;

export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({}));

  // Always return 200 — don't reveal whether the email exists
  if (!email || typeof email !== "string") {
    return NextResponse.json({ ok: true });
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) return NextResponse.json({ ok: true });

  // Delete any existing tokens for this user
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

  // Generate a secure random token
  const token     = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      id: randomBytes(16).toString("hex"),
      userId: user.id,
      token,
      expiresAt,
    },
  });

  const resetUrl = `${BASE}/reset-password?token=${token}`;

  try {
    await resend.emails.send({
      from: FROM,
      to:   user.email,
      subject: "Restablecer contraseña — 100Mxley",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0a0a0f;color:#e2e8f0;border-radius:12px">
          <h2 style="color:#00F5FF;margin-bottom:8px">Recuperar contraseña</h2>
          <p style="color:#94a3b8;margin-bottom:24px">Hola <strong style="color:#e2e8f0">${user.name}</strong>, recibimos una solicitud para restablecer tu contraseña en 100Mxley.</p>
          <a href="${resetUrl}" style="display:inline-block;background:#00F5FF;color:#0a0a0f;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:15px">
            Restablecer contraseña
          </a>
          <p style="color:#64748b;font-size:12px;margin-top:24px">
            Este enlace expira en ${TOKEN_TTL_HOURS} hora. Si no solicitaste este cambio, podés ignorar este email.
          </p>
          <p style="color:#64748b;font-size:11px;margin-top:8px;word-break:break-all">
            O copiá este enlace: ${resetUrl}
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error("[FORGOT_PASSWORD_EMAIL_ERROR]", err);
    // Don't expose email errors to the client
  }

  return NextResponse.json({ ok: true });
}
