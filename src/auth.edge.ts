import NextAuth from "next-auth";
import { authConfigBase } from "./lib/auth.config";

/**
 * Instance NextAuth dédiée au runtime Edge (middleware uniquement). Construite à partir
 * de la config de base sans Prisma/bcrypt — src/middleware.ts doit importer `auth`
 * depuis CE fichier, jamais depuis src/auth.ts (qui charge Prisma et casserait le
 * bundle Edge).
 */
export const { auth } = NextAuth(authConfigBase);
