import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission, assertResourceBelongsToOrg, OrgContextError } from "@/lib/authorize";
import { PERMISSIONS } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

const createSchema = z.object({
  organizationId: z.string().min(1),
  useCaseId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  try {
    const ctx = await requirePermission(PERMISSIONS.RISK_ASSESS, parsed.data.organizationId);
    await assertResourceBelongsToOrg(prisma.useCase, parsed.data.useCaseId, ctx.organizationId);

    const assessment = await prisma.riskAssessment.create({
      data: { organizationId: ctx.organizationId, useCaseId: parsed.data.useCaseId, status: "in_progress" },
    });

    await logAudit({
      organizationId: ctx.organizationId, userId: ctx.userId,
      action: "create", resourceType: "RiskAssessment", resourceId: assessment.id, newState: assessment,
    }, req);

    return NextResponse.json({ assessment }, { status: 201 });
  } catch (err) {
    if (err instanceof OrgContextError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
