import { describe, it, expect } from "vitest";
import { computeRiskScore, validateOverride } from "@/lib/riskScoring";

describe("computeRiskScore", () => {
  it("retourne low pour un tableau de réponses vide", () => {
    expect(computeRiskScore([]).level).toBe("low");
  });

  it("retourne critical quand toutes les réponses sont au maximum", () => {
    const answers = Array.from({ length: 5 }, (_, i) => ({ category: `c${i}`, value: 4, weight: 1 }));
    const result = computeRiskScore(answers);
    expect(result.rawScore).toBe(100);
    expect(result.level).toBe("critical");
  });

  it("retourne low quand toutes les réponses sont au minimum", () => {
    const answers = Array.from({ length: 5 }, (_, i) => ({ category: `c${i}`, value: 0, weight: 1 }));
    expect(computeRiskScore(answers).level).toBe("low");
  });

  it("pondère correctement une question à poids élevé", () => {
    const answers = [
      { category: "confidentiality", value: 4, weight: 5 },
      { category: "bias", value: 0, weight: 1 },
    ];
    const result = computeRiskScore(answers);
    // La contribution de "confidentiality" doit dominer largement le score.
    const confContribution = result.breakdown.find((b) => b.category === "confidentiality")!.contribution;
    expect(confContribution).toBeGreaterThan(50);
  });

  it("fournit un breakdown explicable (somme = rawScore)", () => {
    const answers = [
      { category: "a", value: 2, weight: 1 },
      { category: "b", value: 3, weight: 2 },
    ];
    const result = computeRiskScore(answers);
    const sum = result.breakdown.reduce((s, b) => s + b.contribution, 0);
    expect(sum).toBe(result.rawScore);
  });
});

describe("validateOverride — règle IA responsable §9", () => {
  it("accepte une confirmation simple sans justification", () => {
    expect(validateOverride("high", "high", undefined).valid).toBe(true);
  });

  it("refuse un override sans justification", () => {
    expect(validateOverride("high", "low", undefined).valid).toBe(false);
  });

  it("refuse un override avec une justification trop courte", () => {
    expect(validateOverride("high", "low", "ok").valid).toBe(false);
  });

  it("accepte un override avec justification suffisante", () => {
    expect(validateOverride("high", "low", "Mesures compensatoires déjà en place depuis janvier.").valid).toBe(true);
  });
});
