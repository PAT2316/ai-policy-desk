import { NextResponse } from "next/server";
import { auth } from "@/auth.edge";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/verify-email",
  "/reset-password",
  "/api/auth", // routes NextAuth + endpoints publics d'auth
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

// Pattern officiel NextAuth v5 : on enveloppe le middleware avec auth() plutôt que de
// relire manuellement le cookie de session (source du bug précédent : mauvaise
// reconstitution du "salt"/nom de cookie). auth() gère ça en interne, de façon fiable,
// et reste compatible avec le runtime Edge tant que les callbacks jwt/session de
// src/lib/auth.ts ne font pas d'appel Prisma (ce qui est le cas ici).
export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (isPublicPath(pathname) || pathname.startsWith("/_next") || pathname.startsWith("/static")) {
    return NextResponse.next();
  }

  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
