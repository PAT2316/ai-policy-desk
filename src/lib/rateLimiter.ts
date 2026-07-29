import { prisma } from "./prisma";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_MS = 15 * 60 * 1000;

/**
 * Vérifie si un compte/IP peut tenter une connexion.
 * Basé sur la table LoginAttempt plutôt que Redis (contrainte Hostinger, cf. ADR).
 */
export async function canAttemptLogin(email: string, ipAddress: string): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MS);

  const [emailFailures, ipFailures] = await Promise.all([
    prisma.loginAttempt.count({
      where: { email, success: false, createdAt: { gte: since } },
    }),
    prisma.loginAttempt.count({
      where: { ipAddress, success: false, createdAt: { gte: since } },
    }),
  ]);

  return emailFailures < MAX_ATTEMPTS && ipFailures < MAX_ATTEMPTS * 3;
}

export async function recordLoginAttempt(
  email: string,
  ipAddress: string,
  success: boolean
): Promise<void> {
  await prisma.loginAttempt.create({ data: { email, ipAddress, success } });

  if (success) {
    // Réinitialise le compteur de verrouillage applicatif au niveau utilisateur.
    await prisma.user.updateMany({
      where: { email },
      data: { failedLoginCount: 0, lockedUntil: null },
    });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  const failedLoginCount = user.failedLoginCount + 1;
  const shouldLock = failedLoginCount >= MAX_ATTEMPTS;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginCount,
      lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_MS) : user.lockedUntil,
    },
  });
}

export async function isAccountLocked(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.lockedUntil) return false;
  return user.lockedUntil > new Date();
}
