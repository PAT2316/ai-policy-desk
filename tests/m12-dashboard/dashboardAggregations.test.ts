import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { getDashboardMetrics } from "@/lib/dashboardAggregations";

describe("getDashboardMetrics — isolation stricte", () => {
  let orgA: { id: string };
  let orgB: { id: string };

  beforeAll(async () => {
    orgA = await prisma.organization.create({ data: { name: "Org A Dashboard", country: "CM" } });
    orgB = await prisma.organization.create({ data: { name: "Org B Dashboard", country: "CM" } });

    await prisma.aiTool.create({ data: { organizationId: orgA.id, name: "Outil A" } });
    await prisma.aiTool.create({ data: { organizationId: orgB.id, name: "Outil B1" } });
    await prisma.aiTool.create({ data: { organizationId: orgB.id, name: "Outil B2" } });
  });

  it("ne compte que les outils de l'organisation demandée", async () => {
    const metricsA = await getDashboardMetrics(orgA.id);
    const metricsB = await getDashboardMetrics(orgB.id);

    expect(metricsA.aiToolsCount).toBe(1);
    expect(metricsB.aiToolsCount).toBe(2);
  });
});
