import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, validatePasswordStrength } from "@/lib/password";
import { createVerificationToken, consumeVerificationToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/email";

const requestSchema = z.object({ email: z.string().email() });
const confirmSchema = z.object({ token: z.string().min(10), newPassword: z.string().min(10) });

/** POST /api/auth/reset-password  → demande d'un lien de réinitialisation */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });

  // Réponse générique dans tous les cas (anti-énumération des comptes).
  const genericResponse = NextResponse.json(
    { message: "Si un compte existe pour cet email, un lien de réinitialisation a été envoyé." },
    { status: 200 }
  );

  if (!user) return genericResponse;

  const token = await createVerificationToken(user.id, "password_reset");
  await sendEmail({
    to: user.email,
    template: "password_reset",
    locale: user.locale,
    variables: {
      resetUrl: `${process.env.APP_URL}/reset-password/confirm?token=${token}`,
      name: user.name,
    },
  });

  return genericResponse;
}

/** PUT /api/auth/reset-password  → confirmation avec le nouveau mot de passe */
export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = confirmSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const strength = validatePasswordStrength(parsed.data.newPassword);
  if (!strength.valid) {
    return NextResponse.json({ error: "weak_password", message: strength.reason }, { status: 400 });
  }

  const result = await consumeVerificationToken(parsed.data.token, "password_reset");
  if (!result) {
    return NextResponse.json({ error: "invalid_or_expired_token" }, { status: 400 });
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);

  await prisma.user.update({
    where: { id: result.userId },
    data: { passwordHash, failedLoginCount: 0, lockedUntil: null },
  });

  return NextResponse.json({ message: "Mot de passe réinitialisé avec succès." }, { status: 200 });
}
