import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, assertResourceBelongsToOrg, OrgContextError } from "@/lib/authorize";
import { PERMISSIONS } from "@/lib/permissions";
import { incidentSchema } from "@/lib/incidentSchema";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const orgId = req.nextUrl.searchParams.get("organizationId") ?? undefined;
    const ctx = await requirePermission(PERMISSIONS.INCIDENT_VIEW, orgId);
    const status = req.nextUrl.searchParams.get("status") ?? undefined;

    const items = await prisma.incident.findMany({
      where: { organizationId: ctx.organizationId, deletedAt: null, ...(status ? { status } : {}) },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ items }, { status: 200 });
  } catch (err) {
    if (err instanceof OrgContextError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = incidentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });

  try {
    // Volontairement INCIDENT_CREATE (accessible à Employee) et non INCIDENT_MANAGE : tout collaborateur
    // doit pouvoir signaler un incident (Phase 1 §2 personas).
    const ctx = await requirePermission(PERMISSIONS.INCIDENT_CREATE, parsed.data.organizationId);

    if (parsed.data.aiToolId) await assertResourceBelongsToOrg(prisma.aiTool, parsed.data.aiToolId, ctx.organizationId);
    if (parsed.data.useCaseId) await assertResourceBelongsToOrg(prisma.useCase, parsed.data.useCaseId, ctx.organizationId);

    const incident = await prisma.incident.create({
      data: { ...parsed.data, organizationId: ctx.organizationId, status: "open" },
    });

    await logAudit({
      organizationId: ctx.organizationId, userId: ctx.userId,
      action: "create", resourceType: "Incident", resourceId: incident.id, newState: incident,
    }, req);

    return NextResponse.json({ incident }, { status: 201 });
  } catch (err) {
    if (err instanceof OrgContextError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
