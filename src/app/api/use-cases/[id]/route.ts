import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, assertResourceBelongsToOrg, OrgContextError } from "@/lib/authorize";
import { PERMISSIONS } from "@/lib/permissions";
import { useCaseSchema, useCaseStatusTransitionSchema } from "@/lib/useCaseSchema";
import { logAudit } from "@/lib/audit";

interface RouteParams { params: { id: string } }

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  draft: ["pending_approval"],
  pending_approval: ["approved", "rejected", "draft"],
  approved: ["draft"], // révision possible, repasse en brouillon
  rejected: ["draft"],
};

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const body = await req.json().catch(() => null);
  const parsed = useCaseSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  try {
    const ctx = await requirePermission(PERMISSIONS.USE_CASE_EDIT, parsed.data.organizationId);
    await assertResourceBelongsToOrg(prisma.useCase, params.id, ctx.organizationId);

    const before = await prisma.useCase.findUnique({ where: { id: params.id } });
    const useCase = await prisma.useCase.update({ where: { id: params.id }, data: parsed.data });

    await logAudit({
      organizationId: ctx.organizationId, userId: ctx.userId,
      action: "update", resourceType: "UseCase", resourceId: useCase.id, oldState: before, newState: useCase,
    }, req);

    return NextResponse.json({ useCase }, { status: 200 });
  } catch (err) {
    if (err instanceof OrgContextError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

/** PUT dédié à la transition de statut — permission distincte de l'édition classique. */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const body = await req.json().catch(() => null);
  const parsed = useCaseStatusTransitionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  try {
    const targetStatus = parsed.data.approvalStatus;
    const permission = targetStatus === "approved" || targetStatus === "rejected"
      ? PERMISSIONS.USE_CASE_APPROVE
      : PERMISSIONS.USE_CASE_EDIT;

    const ctx = await requirePermission(permission, parsed.data.organizationId);
    await assertResourceBelongsToOrg(prisma.useCase, params.id, ctx.organizationId);

    const before = await prisma.useCase.findUniqueOrThrow({ where: { id: params.id } });

    const allowed = ALLOWED_TRANSITIONS[before.approvalStatus] ?? [];
    if (!allowed.includes(targetStatus)) {
      return NextResponse.json(
        { error: "invalid_transition", from: before.approvalStatus, to: targetStatus },
        { status: 400 }
      );
    }

    const useCase = await prisma.useCase.update({
      where: { id: params.id },
      data: { approvalStatus: targetStatus },
    });

    await logAudit({
      organizationId: ctx.organizationId, userId: ctx.userId,
      action: "approve", resourceType: "UseCase", resourceId: useCase.id,
      oldState: { approvalStatus: before.approvalStatus }, newState: { approvalStatus: useCase.approvalStatus },
    }, req);

    return NextResponse.json({ useCase }, { status: 200 });
  } catch (err) {
    if (err instanceof OrgContextError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
