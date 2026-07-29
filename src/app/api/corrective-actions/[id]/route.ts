import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, assertResourceBelongsToOrg, OrgContextError } from "@/lib/authorize";
import { PERMISSIONS } from "@/lib/permissions";
import { completeActionSchema } from "@/lib/correctiveActionSchema";
import { logAudit } from "@/lib/audit";

interface RouteParams { params: { id: string } }

/** PUT → clôture d'une action, preuve de réalisation obligatoire (§K du cahier des charges). */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const body = await req.json().catch(() => null);
  const parsed = completeActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", message: "proofDocumentId est obligatoire pour clôturer une action." }, { status: 400 });
  }

  try {
    const ctx = await requirePermission(PERMISSIONS.ACTION_MANAGE, parsed.data.organizationId);
    await assertResourceBelongsToOrg(prisma.correctiveAction, params.id, ctx.organizationId);
    await assertResourceBelongsToOrg(prisma.document, parsed.data.proofDocumentId, ctx.organizationId);

    const action = await prisma.correctiveAction.update({
      where: { id: params.id },
      data: {
        status: "done",
        proofDocumentId: parsed.data.proofDocumentId,
        comment: parsed.data.comment,
        validatedAt: new Date(),
      },
    });

    await logAudit({
      organizationId: ctx.organizationId, userId: ctx.userId,
      action: "approve", resourceType: "CorrectiveAction", resourceId: action.id, newState: action,
    }, req);

    return NextResponse.json({ action }, { status: 200 });
  } catch (err) {
    if (err instanceof OrgContextError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
