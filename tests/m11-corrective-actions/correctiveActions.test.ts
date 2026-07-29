import { describe, it, expect } from "vitest";
import { completeActionSchema, correctiveActionSchema } from "@/lib/correctiveActionSchema";

describe("validation des actions correctives", () => {
  it("exige un titre à la création", () => {
    expect(correctiveActionSchema.safeParse({ organizationId: "o1", title: "" }).success).toBe(false);
  });

  it("refuse la clôture sans preuve de réalisation", () => {
    expect(completeActionSchema.safeParse({ organizationId: "o1" }).success).toBe(false);
  });

  it("accepte la clôture avec une preuve fournie", () => {
    expect(completeActionSchema.safeParse({ organizationId: "o1", proofDocumentId: "doc-1" }).success).toBe(true);
  });
});
