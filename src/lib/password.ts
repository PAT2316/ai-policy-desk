import * as argon2 from "argon2";

const HASH_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

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
  return argon2.hash(password, HASH_OPTIONS);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    // Hash corrompu ou format inattendu : échec silencieux, jamais d'exception qui fuite d'info.
    return false;
  }
}
