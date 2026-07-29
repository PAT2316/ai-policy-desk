import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission, OrgContextError } from "@/lib/authorize";
import { PERMISSIONS, SYSTEM_ROLES } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

const updateSchema = z.object({
  organizationId: z.string().min(1),
  roleId: z.string().min(1),
});

interface RouteParams {
  params: { membershipId: string };
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  try {
    const ctx = await requirePermission(PERMISSIONS.MEMBER_MANAGE_ROLE, parsed.data.organizationId);

    // La ressource ciblée doit appartenir à l'organisation du contexte — jamais de confiance dans l'URL seule.
    const membership = await prisma.membership.findUnique({ where: { id: params.membershipId } });
    if (!membership || membership.organizationId !== ctx.organizationId) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const newRole = await prisma.role.findUnique({ where: { id: parsed.data.roleId } });
    if (!newRole || newRole.organizationId !== ctx.organizationId) {
      return NextResponse.json({ error: "invalid_role_for_organization" }, { status: 400 });
    }

    // Empêche de retirer le dernier Owner de l'organisation (risque d'organisation orpheline).
    const currentRole = await prisma.role.findUnique({ where: { id: membership.roleId } });
    if (currentRole?.name === SYSTEM_ROLES.OWNER && newRole.name !== SYSTEM_ROLES.OWNER) {
      const ownerCount = await prisma.membership.count({
        where: { organizationId: ctx.organizationId, role: { name: SYSTEM_ROLES.OWNER }, status: "active" },
      });
      if (ownerCount <= 1) {
        return NextResponse.json({ error: "cannot_remove_last_owner" }, { status: 400 });
      }
    }

    const oldState = { ...membership };
    const updated = await prisma.membership.update({
      where: { id: membership.id },
      data: { roleId: newRole.id },
    });

    await logAudit({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      action: "role_change",
      resourceType: "Membership",
      resourceId: updated.id,
      oldState,
      newState: updated,
    });

    return NextResponse.json({ membership: updated }, { status: 200 });
  } catch (err) {
    if (err instanceof OrgContextError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const organizationId = req.nextUrl.searchParams.get("organizationId") ?? undefined;

  try {
    const ctx = await requirePermission(PERMISSIONS.MEMBER_REMOVE, organizationId);

    const membership = await prisma.membership.findUnique({ where: { id: params.membershipId } });
    if (!membership || membership.organizationId !== ctx.organizationId) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const role = await prisma.role.findUnique({ where: { id: membership.roleId } });
    if (role?.name === SYSTEM_ROLES.OWNER) {
      const ownerCount = await prisma.membership.count({
        where: { organizationId: ctx.organizationId, role: { name: SYSTEM_ROLES.OWNER }, status: "active" },
      });
      if (ownerCount <= 1) {
        return NextResponse.json({ error: "cannot_remove_last_owner" }, { status: 400 });
      }
    }

    await prisma.membership.update({ where: { id: membership.id }, data: { status: "suspended" } });

    await logAudit({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      action: "delete",
      resourceType: "Membership",
      resourceId: membership.id,
      oldState: membership,
    });

    return NextResponse.json({ message: "Membre révoqué." }, { status: 200 });
  } catch (err) {
    if (err instanceof OrgContextError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
