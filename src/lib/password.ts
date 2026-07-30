import bcrypt from "bcryptjs";

// bcryptjs plutôt qu'argon2 : argon2 nécessite un binaire natif compilé, ce qui échoue
// dans l'environnement serverless de Vercel ("No native build was found"). bcryptjs est
// une implémentation 100% JavaScript, sans dépendance de compilation.
const SALT_ROUNDS = 12;

const MIN_LENGTH = 10;

export function validatePasswordStrength(password: string): { valid: boolean; reason?: string } {
  if (password.length < MIN_LENGTH) {
    return { valid: false, reason: `Le mot de passe doit contenir au moins ${MIN_LENGTH} caractères.` };
  }
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasDigitOrSymbol = /[\d\W]/.test(password);
  if (!hasLetter || !hasDigitOrSymbol) {
    return { valid: false, reason: "Le mot de passe doit combiner lettres et chiffres/symboles." };
  }
  return { valid: true };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    // Hash corrompu ou format inattendu : échec silencieux, jamais d'exception qui fuite d'info.
    return false;
  }
}
