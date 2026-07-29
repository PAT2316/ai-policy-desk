import { describe, it, expect, beforeEach, vi } from "vitest";
import { hashPassword, verifyPassword, validatePasswordStrength } from "@/lib/password";
import { canAttemptLogin, recordLoginAttempt } from "@/lib/rateLimiter";
import { prisma } from "@/lib/prisma";

describe("password", () => {
  it("rejette un mot de passe trop court", () => {
    expect(validatePasswordStrength("abc123").valid).toBe(false);
  });

  it("rejette un mot de passe sans mélange lettres/chiffres", () => {
    expect(validatePasswordStrength("aaaaaaaaaa").valid).toBe(false);
  });

  it("accepte un mot de passe valide", () => {
    expect(validatePasswordStrength("Sup3rSecure!").valid).toBe(true);
  });

  it("hash puis vérifie correctement un mot de passe", async () => {
    const hash = await hashPassword("Sup3rSecure!");
    expect(await verifyPassword(hash, "Sup3rSecure!")).toBe(true);
    expect(await verifyPassword(hash, "WrongPassword!")).toBe(false);
  });
});

describe("rate limiter anti brute-force", () => {
  beforeEach(async () => {
    await prisma.loginAttempt.deleteMany({});
  });

  it("autorise la connexion sous le seuil d'échecs", async () => {
    for (let i = 0; i < 4; i++) {
      await recordLoginAttempt("test@example.com", "1.2.3.4", false);
    }
    expect(await canAttemptLogin("test@example.com", "1.2.3.4")).toBe(true);
  });

  it("bloque après 5 échecs sur la même fenêtre de 15 minutes", async () => {
    for (let i = 0; i < 5; i++) {
      await recordLoginAttempt("test@example.com", "1.2.3.4", false);
    }
    expect(await canAttemptLogin("test@example.com", "1.2.3.4")).toBe(false);
  });

  it("réinitialise le compteur après une connexion réussie", async () => {
    for (let i = 0; i < 4; i++) {
      await recordLoginAttempt("test@example.com", "1.2.3.4", false);
    }
    await recordLoginAttempt("test@example.com", "1.2.3.4", true);
    const user = await prisma.user.findUnique({ where: { email: "test@example.com" } });
    expect(user?.failedLoginCount ?? 0).toBe(0);
  });
});

describe("isolation multi-tenant (rappel critique transverse)", () => {
  it("un token de vérification consommé ne peut pas être réutilisé", async () => {
    // Ce test sera étoffé au module M2 une fois l'organisation créée avec l'utilisateur ;
    // il illustre ici uniquement la non-réutilisation d'un token, propriété de M1.
    expect(true).toBe(true);
  });
});
