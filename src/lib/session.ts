import { auth } from "@/auth";

/**
 * Point d'entrée unique pour lire la session côté serveur, utilisé par tous les modules
 * (M2 orgContext, M1 2FA, etc.). Réexporte simplement auth() de src/auth.ts sous un nom
 * plus explicite pour le reste du code métier.
 */
export async function getServerSession() {
  return auth();
}
