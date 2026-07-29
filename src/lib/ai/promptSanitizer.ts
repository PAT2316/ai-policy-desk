/**
 * Traite tout contenu importé par l'utilisateur (réponses de questionnaire, texte libre)
 * comme une DONNÉE, jamais comme une instruction système (§9 : "interdire aux documents
 * importés de modifier les instructions système").
 */

const SUSPICIOUS_PATTERNS = [
  /ignore\s+(les\s+)?(instructions|règles)\s+précédentes/i,
  /ignore\s+(previous|all)\s+instructions/i,
  /system\s*prompt/i,
  /you\s+are\s+now/i,
  /nouveau\s+rôle\s*:/i,
];

export interface SanitizedField {
  value: string;
  flagged: boolean;
}

/**
 * N'essaie pas de "nettoyer" intelligemment le texte (ce serait fragile) : signale seulement
 * les tentatives évidentes pour audit, et encadre systématiquement la valeur dans un bloc de
 * données explicite avant de l'insérer dans le prompt final.
 */
export function sanitizeUserField(rawValue: string): SanitizedField {
  const flagged = SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(rawValue));
  return { value: rawValue, flagged };
}

/**
 * Construit le prompt final en isolant clairement les données utilisateur des instructions système,
 * avec des délimiteurs explicites que l'utilisateur ne peut pas produire lui-même dans un champ de formulaire normal.
 */
export function buildDelimitedUserBlock(label: string, value: string): string {
  return `<user_data field="${label}">\n${value}\n</user_data>`;
}
