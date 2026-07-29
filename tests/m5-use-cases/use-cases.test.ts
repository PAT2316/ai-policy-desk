import { describe, it, expect } from "vitest";
import { useCaseSchema } from "@/lib/useCaseSchema";

describe("validation UseCase", () => {
  it("exige un titre", () => {
    expect(useCaseSchema.safeParse({ organizationId: "o1", title: "" }).success).toBe(false);
  });
});

describe("machine à états d'approbation (logique de transition)", () => {
  const ALLOWED: Record<string, string[]> = {
    draft: ["pending_approval"],
    pending_approval: ["approved", "rejected", "draft"],
    approved: ["draft"],
    rejected: ["draft"],
  };

  it("autorise draft -> pending_approval", () => {
    expect(ALLOWED.draft.includes("pending_approval")).toBe(true);
  });

  it("interdit draft -> approved directement (doit passer par pending_approval)", () => {
    expect(ALLOWED.draft.includes("approved")).toBe(false);
  });
});
