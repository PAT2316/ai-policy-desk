import NextAuth from "next-auth";
import { authConfig } from "./lib/auth";

/**
 * Point d'entrée unique NextAuth v5 : exporte handlers (pour la route API),
 * auth() (pour lire la session côté serveur), signIn/signOut.
 * Ne pas appeler NextAuth(authConfig) ailleurs dans le code — toujours importer depuis ce fichier.
 */
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
