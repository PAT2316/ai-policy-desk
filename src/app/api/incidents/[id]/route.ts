import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, assertResourceBelongsToOrg, OrgContextError } from "@/lib/authorize";
import { PERMISSIONS } from "@/lib/permissions";
import { incidentStatusSchema, isValidIncidentTransition } from "@/lib/incidentSchema";
import { logAudit } from "@/lib/audit";

interface RouteParams { params: { id: string } }

/** PUT → changement de statut, réservé à la gestion des incidents (pas à la simple déclaration). */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const body = await req.json().catch(() => null);
  const parsed = incidentStatusSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  try {
    const ctx = await requirePermission(PERMISSIONS.INCIDENT_MANAGE, parsed.data.organizationId);
    await assertResourceBelongsToOrg(prisma.incident, params.id, ctx.organizationId);

    const before = await prisma.incident.findUniqueOrThrow({ where: { id: params.id } });

    if (!isValidIncidentTransition(before.status, parsed.data.status)) {
      return NextResponse.json({ error: "invalid_transition", from: before.status, to: parsed.data.status }, { status: 400 });
    }

    const incident = await prisma.incident.update({
      where: { id: params.id },
      data: {
        status: parsed.data.status,
        closedAt: parsed.data.status === "closed" ? new Date() : before.closedAt,
      },
    });

    await logAudit({
      organizationId: ctx.organizationId, userId: ctx.userId,
      action: "update", resourceType: "Incident", resourceId: incident.id,
      oldState: { status: before.status }, newState: { status: incident.status },
    }, req);

    return NextResponse.json({ incident }, { status: 200 });
  } catch (err) {
    if (err instanceof OrgContextError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
