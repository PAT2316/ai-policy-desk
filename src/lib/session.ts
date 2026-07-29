import { getServerSession as getNextAuthSession } from "next-auth/next";
import { authConfig } from "./auth";

/**
 * Point d'entrée unique pour lire la session côté serveur.
 * Centralisé ici pour que tous les modules (M2 orgContext, M1 2FA, etc.)
 * utilisent exactement la même configuration Auth.js.
 */
export async function getServerSession() {
  return getNextAuthSession(authConfig);
}
