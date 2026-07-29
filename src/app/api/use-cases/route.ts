import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, assertResourceBelongsToOrg, OrgContextError } from "@/lib/authorize";
import { PERMISSIONS } from "@/lib/permissions";
import { useCaseSchema } from "@/lib/useCaseSchema";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const orgId = req.nextUrl.searchParams.get("organizationId") ?? undefined;
    const ctx = await requirePermission(PERMISSIONS.USE_CASE_VIEW, orgId);
    const approvalStatus = req.nextUrl.searchParams.get("approvalStatus") ?? undefined;

    const items = await prisma.useCase.findMany({
      where: { organizationId: ctx.organizationId, deletedAt: null, ...(approvalStatus ? { approvalStatus } : {}) },
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
  const parsed = useCaseSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });

  try {
    const ctx = await requirePermission(PERMISSIONS.USE_CASE_CREATE, parsed.data.organizationId);

    // Toute référence croisée (outil, département) doit appartenir à la même organisation.
    if (parsed.data.aiToolId) {
      await assertResourceBelongsToOrg(prisma.aiTool, parsed.data.aiToolId, ctx.organizationId);
    }
    if (parsed.data.departmentId) {
      await assertResourceBelongsToOrg(prisma.department, parsed.data.departmentId, ctx.organizationId);
    }

    const useCase = await prisma.useCase.create({
      data: { ...parsed.data, organizationId: ctx.organizationId, approvalStatus: "draft" },
    });

    await logAudit({
      organizationId: ctx.organizationId, userId: ctx.userId,
      action: "create", resourceType: "UseCase", resourceId: useCase.id, newState: useCase,
    }, req);

    return NextResponse.json({ useCase }, { status: 201 });
  } catch (err) {
    if (err instanceof OrgContextError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
