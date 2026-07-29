import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, assertResourceBelongsToOrg, OrgContextError } from "@/lib/authorize";
import { PERMISSIONS } from "@/lib/permissions";
import { correctiveActionSchema } from "@/lib/correctiveActionSchema";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const orgId = req.nextUrl.searchParams.get("organizationId") ?? undefined;
    const ctx = await requirePermission(PERMISSIONS.ACTION_MANAGE, orgId);
    const status = req.nextUrl.searchParams.get("status") ?? undefined;

    const items = await prisma.correctiveAction.findMany({
      where: { organizationId: ctx.organizationId, ...(status ? { status } : {}) },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json({ items }, { status: 200 });
  } catch (err) {
    if (err instanceof OrgContextError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = correctiveActionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  try {
    const ctx = await requirePermission(PERMISSIONS.ACTION_MANAGE, parsed.data.organizationId);

    if (parsed.data.incidentId) {
      await assertResourceBelongsToOrg(prisma.incident, parsed.data.incidentId, ctx.organizationId);
    }

    const action = await prisma.correctiveAction.create({
      data: { ...parsed.data, organizationId: ctx.organizationId, status: "open" },
    });

    await logAudit({
      organizationId: ctx.organizationId, userId: ctx.userId,
      action: "create", resourceType: "CorrectiveAction", resourceId: action.id, newState: action,
    }, req);

    return NextResponse.json({ action }, { status: 201 });
  } catch (err) {
    if (err instanceof OrgContextError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
