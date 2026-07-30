import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { DEFAULT_ROLE_PERMISSIONS, SYSTEM_ROLES } from "@/lib/permissions";
import { logAudit } from "@/lib/audit"; // branché en M3 ; no-op si M3 pas encore livré

const createOrgSchema = z.object({
  name: z.string().min(1).max(200),
  country: z.string().length(2), // code ISO
  sector: z.string().max(100).optional(),
  size: z.enum(["1-10", "11-50", "51-200", "201-1000", "1000+"]).optional(),
  primaryLanguage: z.enum(["fr", "en"]).default("fr"),
  timezone: z.string().default("Africa/Douala"),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createOrgSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  // Le catalogue de permissions est censé être déjà peuplé par prisma/seed.ts. On le charge
  // en une seule requête AVANT la transaction (pas besoin d'upsert répétés dedans), pour
  // limiter drastiquement le nombre d'allers-retours vers la base pendant la transaction
  // (la latence Vercel <-> Railway rendait la version précédente trop lente : elle dépassait
  // le délai maximal d'une transaction interactive Prisma).
  const allPermissionCodes = Array.from(
    new Set(Object.values(DEFAULT_ROLE_PERMISSIONS).flat())
  );
  const existingPermissions = await prisma.permission.findMany({
    where: { code: { in: allPermissionCodes } },
  });
  const permissionIdByCode = new Map(existingPermissions.map((p) => [p.code, p.id]));

  // Permissions manquantes (ex. premier lancement, seed pas encore exécuté) : on les crée ici,
  // en dehors de la transaction principale, en une seule requête groupée.
  const missingCodes = allPermissionCodes.filter((code) => !permissionIdByCode.has(code));
  if (missingCodes.length > 0) {
    await prisma.permission.createMany({
      data: missingCodes.map((code) => ({ code, description: code })),
      skipDuplicates: true,
    });
    const created = await prisma.permission.findMany({ where: { code: { in: missingCodes } } });
    for (const p of created) permissionIdByCode.set(p.code, p.id);
  }

  // Transaction : organisation + rôles système + permissions + appartenance Owner doivent réussir ensemble.
  const result = await prisma.$transaction(
    async (tx) => {
      const organization = await tx.organization.create({ data: parsed.data });

      const roleMap = new Map<string, string>(); // roleName -> roleId

      for (const [roleName, permissionCodes] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
        const role = await tx.role.create({
          data: { organizationId: organization.id, name: roleName, isSystem: true },
        });
        roleMap.set(roleName, role.id);

        const rolePermissionRows = Array.from(new Set(permissionCodes))
          .map((code) => permissionIdByCode.get(code))
          .filter((id): id is string => Boolean(id))
          .map((permissionId) => ({ roleId: role.id, permissionId }));

        if (rolePermissionRows.length > 0) {
          await tx.rolePermission.createMany({ data: rolePermissionRows });
        }
      }

      const ownerRoleId = roleMap.get(SYSTEM_ROLES.OWNER)!;

      await tx.membership.create({
        data: {
          userId: session.user!.id,
          organizationId: organization.id,
          roleId: ownerRoleId,
          status: "active",
          joinedAt: new Date(),
        },
      });

      return organization;
    },
    { timeout: 20000, maxWait: 10000 }
  );

  await logAudit({
    organizationId: result.id,
    userId: session.user.id,
    action: "create",
    resourceType: "Organization",
    resourceId: result.id,
    newState: result,
  });

  return NextResponse.json({ organization: result }, { status: 201 });
}
