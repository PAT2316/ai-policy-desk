import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfigBase } from "./auth.config";
import { prisma } from "./prisma";
import { verifyPassword } from "./password";
import { canAttemptLogin, recordLoginAttempt, isAccountLocked } from "./rateLimiter";

// Configuration complète (Node.js) : reprend la base Edge-safe et y ajoute le
// fournisseur Credentials, qui a besoin de Prisma et bcrypt. Utilisée uniquement
// côté serveur Node.js classique — jamais dans le middleware (voir src/auth.edge.ts).
export const authConfig: NextAuthConfig = {
  ...authConfigBase,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials, request) {
        const email = String(credentials?.email ?? "").toLowerCase().trim();
        const password = String(credentials?.password ?? "");
        const ipAddress = request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

        if (!email || !password) return null;

        if (await isAccountLocked(email)) {
          throw new Error("ACCOUNT_LOCKED");
        }
        if (!(await canAttemptLogin(email, ipAddress))) {
          throw new Error("TOO_MANY_ATTEMPTS");
        }

        const user = await prisma.user.findUnique({ where: { email } });

        // Toujours exécuter verifyPassword même si l'utilisateur n'existe pas,
        // afin d'éviter une différence de timing révélant l'existence du compte.
        const passwordHash = user?.passwordHash ?? "$2b$12$Tw3kAqQJTPW5OUTQ0q3dHebC44I57L5ysqxOerzo8xLLWeigmazo2";
        const passwordValid = await verifyPassword(passwordHash, password);

        const success = Boolean(user && passwordValid && user.status === "active" && user.emailVerifiedAt);

        await recordLoginAttempt(email, ipAddress, success);

        if (!success || !user) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          locale: user.locale,
        };
      },
    }),
  ],
};
