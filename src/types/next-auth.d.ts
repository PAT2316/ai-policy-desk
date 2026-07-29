import { DefaultSession } from "next-auth";

/**
 * Le callback `session` dans src/lib/auth.ts ajoute bien `id` et `locale` à session.user
 * à l'exécution, mais TypeScript ne le sait pas sans cette déclaration — sans elle, tout
 * accès à session.user.id est typé "string | undefined" en mode strict.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      locale?: string;
    } & DefaultSession["user"];
  }
}
