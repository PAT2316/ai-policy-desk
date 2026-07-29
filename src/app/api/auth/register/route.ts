import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, validatePasswordStrength } from "@/lib/password";
import { createVerificationToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/email"; // interface EmailProvider (ADR — Brevo au MVP)

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(10),
  name: z.string().min(1).max(200),
  locale: z.enum(["fr", "en"]).default("fr"),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { email, password, name, locale } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const strength = validatePasswordStrength(password);
  if (!strength.valid) {
    return NextResponse.json({ error: "weak_password", message: strength.reason }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    // Réponse volontairement générique : ne révèle pas si l'email existe déjà (anti-énumération).
    return NextResponse.json(
      { message: "Si cet email n'est pas déjà utilisé, un email de vérification vient d'être envoyé." },
      { status: 200 }
    );
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      name,
      locale,
      status: "active",
    },
  });

  const token = await createVerificationToken(user.id, "email_verification");
  const verificationUrl = `${process.env.APP_URL}/verify-email?token=${token}`;

  await sendEmail({
    to: user.email,
    template: "email_verification",
    locale: user.locale,
    variables: { verificationUrl, name: user.name },
  });

  return NextResponse.json(
    {
      message: "Si cet email n'est pas déjà utilisé, un email de vérification vient d'être envoyé.",
      // Commodité MVP uniquement tant qu'aucun vrai fournisseur d'email n'est configuré :
      // sans ça, le lien de vérification ne serait visible que dans les logs serveur.
      // À retirer dès que EMAIL_PROVIDER=brevo est actif en production.
      ...(process.env.EMAIL_PROVIDER !== "brevo" ? { devVerificationUrl: verificationUrl } : {}),
    },
    { status: 200 }
  );
}
