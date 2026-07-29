import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { assertResourceBelongsToOrg, OrgContextError } from "@/lib/authorize";

describe("isolation multi-tenant — le test le plus important du produit", () => {
  let orgA: { id: string };
  let orgB: { id: string };
  let toolOfOrgB: { id: string; organizationId: string };

  beforeAll(async () => {
    orgA = await prisma.organization.create({ data: { name: "Org A", country: "CM" } });
    orgB = await prisma.organization.create({ data: { name: "Org B", country: "CM" } });
    // AiTool factice pour le test — le vrai modèle sera manipulé en M4, mais la fonction
    // assertResourceBelongsToOrg est générique et testable dès maintenant.
    toolOfOrgB = await prisma.aiTool.create({
      data: { organizationId: orgB.id, name: "Outil confidentiel Org B" },
    });
  });

  it("refuse l'accès à une ressource d'une autre organisation", async () => {
    await expect(
      assertResourceBelongsToOrg(prisma.aiTool, toolOfOrgB.id, orgA.id)
    ).rejects.toThrow(OrgContextError);
  });

  it("autorise l'accès à une ressource de sa propre organisation", async () => {
    await expect(
      assertResourceBelongsToOrg(prisma.aiTool, toolOfOrgB.id, orgB.id)
    ).resolves.not.toThrow();
  });

  it("refuse l'accès si la ressource n'existe pas du tout", async () => {
    await expect(
      assertResourceBelongsToOrg(prisma.aiTool, "id-inexistant", orgA.id)
    ).rejects.toThrow(OrgContextError);
  });
});
