/**
 * Moteur de calcul du score de risque — fonction pure, sans accès DB, pour rester
 * facilement testable et auditable ("le calcul du score doit être explicable").
 */

export interface WeightedAnswer {
  category: string;
  value: number; // 0 à 4 (échelle de gravité de la réponse)
  weight: number; // poids de la question dans le score global
}

export type RiskLevel = "low" | "moderate" | "high" | "critical";

export interface RiskScoreResult {
  rawScore: number; // 0 à 100
  level: RiskLevel;
  breakdown: { category: string; contribution: number }[]; // pour l'explicabilité
}

const MAX_ANSWER_VALUE = 4;

const LEVEL_THRESHOLDS: { max: number; level: RiskLevel }[] = [
  { max: 25, level: "low" },
  { max: 50, level: "moderate" },
  { max: 75, level: "high" },
  { max: 100, level: "critical" },
];

export function computeRiskScore(answers: WeightedAnswer[]): RiskScoreResult {
  if (answers.length === 0) {
    return { rawScore: 0, level: "low", breakdown: [] };
  }

  const totalWeight = answers.reduce((sum, a) => sum + a.weight, 0);
  if (totalWeight === 0) {
    return { rawScore: 0, level: "low", breakdown: [] };
  }

  const breakdown = answers.map((a) => ({
    category: a.category,
    // Contribution normalisée sur 100, proportionnelle au poids de la question.
    contribution: Math.round(((a.value / MAX_ANSWER_VALUE) * a.weight * 100) / totalWeight),
  }));

  const rawScore = breakdown.reduce((sum, b) => sum + b.contribution, 0);
  const level = LEVEL_THRESHOLDS.find((t) => rawScore <= t.max)?.level ?? "critical";

  return { rawScore, level, breakdown };
}

/**
 * Un override humain du niveau calculé n'est valide que s'il est accompagné d'une justification.
 * Cette fonction ne décide jamais elle-même — elle valide uniquement la présence de la justification
 * requise par la règle métier (cahier des charges §F : "L'utilisateur autorisé doit pouvoir confirmer
 * ou modifier le classement avec une justification").
 */
export function validateOverride(
  computedLevel: RiskLevel,
  requestedLevel: RiskLevel,
  justification: string | undefined
): { valid: boolean; reason?: string } {
  if (computedLevel === requestedLevel) {
    return { valid: true }; // confirmation simple, pas de justification requise
  }
  if (!justification || justification.trim().length < 10) {
    return { valid: false, reason: "Une justification d'au moins 10 caractères est requise pour modifier le niveau calculé." };
  }
  return { valid: true };
}
