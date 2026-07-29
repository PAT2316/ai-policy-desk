import { randomBytes, createHash } from "crypto";
import { prisma } from "./prisma";

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1h

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createVerificationToken(
  userId: string,
  type: "email_verification" | "password_reset"
): Promise<string> {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const ttl = type === "email_verification" ? EMAIL_VERIFICATION_TTL_MS : PASSWORD_RESET_TTL_MS;

  await prisma.verificationToken.create({
    data: {
      userId,
      type,
      tokenHash,
      expiresAt: new Date(Date.now() + ttl),
    },
  });

  return rawToken; // seul le hash est stocké ; le token brut part uniquement par email
}

export async function consumeVerificationToken(
  rawToken: string,
  type: "email_verification" | "password_reset"
): Promise<{ userId: string } | null> {
  const tokenHash = hashToken(rawToken);

  const record = await prisma.verificationToken.findUnique({ where: { tokenHash } });

  if (!record || record.type !== type || record.usedAt || record.expiresAt < new Date()) {
    return null;
  }

  // Marquage atomique "utilisé" pour empêcher toute réutilisation (protection contre double-clic / rejeu).
  const updated = await prisma.verificationToken.updateMany({
    where: { id: record.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  if (updated.count === 0) {
    return null; // déjà consommé entre-temps (concurrence)
  }

  return { userId: record.userId };
}
