import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { verifyPassword } from "./password";
import { canAttemptLogin, recordLoginAttempt, isAccountLocked } from "./rateLimiter";

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 }, // 8h, renouvelée à l'activité
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials, request) {
        const email = String(credentials?.email ?? "").toLowerCase().trim();
        const password = String(credentials?.password ?? "");
        // En prod, dériver l'IP depuis les en-têtes de confiance (proxy Hostinger/Cloudflare).
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
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.locale = (user as { locale?: string }).locale;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        (session.user as { locale?: string }).locale = token.locale as string | undefined;
      }
      return session;
    },
  },
};
