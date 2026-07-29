import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticator } from "otplib";
import { encrypt, decrypt } from "@/lib/crypto"; // chiffrement au repos du secret TOTP
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

const verifySchema = z.object({ code: z.string().length(6) });

/** POST /api/auth/2fa → génère un secret TOTP et retourne l'URL otpauth (à afficher en QR code côté client) */
export async function POST() {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const secret = authenticator.generateSecret();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });

  // Le secret est chiffré au repos ; il n'est activé (twoFactorEnabled=true) qu'après vérification d'un code valide.
  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorSecret: encrypt(secret) },
  });

  const otpauthUrl = authenticator.keyuri(user.email, "AI Policy Desk", secret);

  return NextResponse.json({ otpauthUrl }, { status: 200 });
}

/** PUT /api/auth/2fa → confirme l'activation avec un premier code TOTP valide */
export async function PUT(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  if (!user.twoFactorSecret) {
    return NextResponse.json({ error: "no_pending_setup" }, { status: 400 });
  }

  const secret = decrypt(user.twoFactorSecret);
  const isValid = authenticator.verify({ token: parsed.data.code, secret });

  if (!isValid) {
    return NextResponse.json({ error: "invalid_code" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: true },
  });

  return NextResponse.json({ message: "2FA activée avec succès." }, { status: 200 });
}
