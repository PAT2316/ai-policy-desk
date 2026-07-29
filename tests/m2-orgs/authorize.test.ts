import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { requirePermission, OrgContextError } from "@/lib/authorize";
import { PERMISSIONS, SYSTEM_ROLES } from "@/lib/permissions";

// Ces tests supposent un mécanisme de mock de session (getServerSession) injectant
// successivement des utilisateurs différents — voir tests/setup.ts (non détaillé ici).

describe("requirePermission", () => {
  it("refuse un utilisateur sans membership actif", async () => {
    await expect(requirePermission(PERMISSIONS.AI_TOOL_CREATE)).rejects.toThrow(OrgContextError);
  });

  it("refuse un rôle Auditor sur une permission d'écriture", async () => {
    // setup: utilisateur "auditor@test.com" avec rôle Auditor dans org-test
    await expect(async () => {
      await requirePermission(PERMISSIONS.AI_TOOL_CREATE, "org-test");
    }).rejects.toThrow(/missing_permission/);
  });

  it("autorise un rôle Owner sur toutes les permissions", async () => {
    const ctx = await requirePermission(PERMISSIONS.BILLING_MANAGE, "org-test-owner");
    expect(ctx.organizationId).toBe("org-test-owner");
  });

  it("le rôle Auditor ne possède que des permissions se terminant par :view (ou audit_log:view)", async () => {
    const auditorRole = await prisma.role.findFirst({
      where: { name: SYSTEM_ROLES.AUDITOR },
      include: { rolePermissions: { include: { permission: true } } },
    });
    const codes = auditorRole?.rolePermissions.map((rp) => rp.permission.code) ?? [];
    for (const code of codes) {
      expect(code.endsWith(":view") || code === PERMISSIONS.AUDIT_LOG_VIEW).toBe(true);
    }
  });
});
