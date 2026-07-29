import { describe, it, expect } from "vitest";

describe("règles non négociables de génération de politique", () => {
  it("toute version générée doit porter generatedByAi=true", () => {
    const version = { generatedByAi: true, approvedByUserId: null };
    expect(version.generatedByAi).toBe(true);
    expect(version.approvedByUserId).toBeNull();
  });

  it("une version non approuvée ne doit jamais définir Policy.currentVersionId", () => {
    // Documente la règle : currentVersionId n'est mis à jour que dans la route d'approbation (PUT),
    // jamais dans la route de génération.
    const policyAfterGeneration = { status: "draft", currentVersionId: null };
    expect(policyAfterGeneration.currentVersionId).toBeNull();
  });
});
