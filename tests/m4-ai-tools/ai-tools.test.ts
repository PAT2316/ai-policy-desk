import { describe, it, expect } from "vitest";
import { aiToolSchema } from "@/lib/aiToolSchema";

describe("validation AiTool", () => {
  it("rejette un nom vide", () => {
    expect(aiToolSchema.safeParse({ organizationId: "o1", name: "" }).success).toBe(false);
  });

  it("applique les valeurs par défaut (status=active, criticality=low)", () => {
    const parsed = aiToolSchema.parse({ organizationId: "o1", name: "ChatGPT" });
    expect(parsed.status).toBe("active");
    expect(parsed.criticality).toBe("low");
  });

  it("rejette une URL de politique de confidentialité invalide", () => {
    expect(
      aiToolSchema.safeParse({ organizationId: "o1", name: "X", privacyPolicyUrl: "not-a-url" }).success
    ).toBe(false);
  });
});
