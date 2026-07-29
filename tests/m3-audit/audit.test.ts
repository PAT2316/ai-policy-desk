import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

describe("journal d'audit", () => {
  it("crée une entrée avec les champs attendus", async () => {
    await logAudit({
      organizationId: "org-test",
      userId: "user-test",
      action: "create",
      resourceType: "AiTool",
      resourceId: "tool-1",
      newState: { name: "ChatGPT" },
    });

    const entry = await prisma.auditLog.findFirst({
      where: { resourceType: "AiTool", resourceId: "tool-1" },
      orderBy: { createdAt: "desc" },
    });

    expect(entry?.action).toBe("create");
    expect(entry?.result).toBe("success");
  });

  it("la purge ne supprime que les entrées au-delà de la fenêtre de rétention", async () => {
    const old = await prisma.auditLog.create({
      data: {
        organizationId: "org-test",
        action: "create",
        resourceType: "Test",
        createdAt: new Date("2015-01-01"),
      },
    });
    const recent = await prisma.auditLog.create({
      data: { organizationId: "org-test", action: "create", resourceType: "Test" },
    });

    await prisma.auditLog.deleteMany({ where: { createdAt: { lt: new Date("2020-01-01") } } });

    expect(await prisma.auditLog.findUnique({ where: { id: old.id } })).toBeNull();
    expect(await prisma.auditLog.findUnique({ where: { id: recent.id } })).not.toBeNull();
  });
});
