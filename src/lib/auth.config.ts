import type { NextAuthConfig } from "next-auth";

/**
 * Configuration "Edge-safe" : aucune dépendance Node.js (Prisma, bcrypt) ici.
 * Utilisée par le middleware (runtime Edge, src/auth.edge.ts) pour lire/valider le
 * token de session sans jamais charger Prisma. Le fournisseur Credentials (qui a
 * besoin de Prisma/bcrypt) est ajouté uniquement dans src/lib/auth.ts, utilisé côté
 * serveur Node.js classique (routes API, composants serveur — src/auth.ts).
 */
export const authConfigBase: NextAuthConfig = {
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 }, // 8h, renouvelée à l'activité
  pages: { signIn: "/login" },
  providers: [],
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
