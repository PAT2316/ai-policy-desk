import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission, assertResourceBelongsToOrg, OrgContextError } from "@/lib/authorize";
import { PERMISSIONS } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

interface RouteParams { params: { id: string } }

const approveSchema = z.object({
  organizationId: z.string().min(1),
  versionId: z.string().min(1),
});

/** PUT → approbation humaine explicite d'une version de politique (jamais automatique). */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const body = await req.json().catch(() => null);
  const parsed = approveSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  try {
    const ctx = await requirePermission(PERMISSIONS.POLICY_APPROVE, parsed.data.organizationId);
    await assertResourceBelongsToOrg(prisma.policy, params.id, ctx.organizationId);

    const version = await prisma.policyVersion.findUniqueOrThrow({ where: { id: parsed.data.versionId } });
    if (version.policyId !== params.id) {
      return NextResponse.json({ error: "version_does_not_belong_to_policy" }, { status: 400 });
    }

    const updatedVersion = await prisma.policyVersion.update({
      where: { id: version.id },
      data: { approvedByUserId: ctx.userId, approvedAt: new Date() },
    });

    await prisma.policy.update({ where: { id: params.id }, data: { status: "approved", currentVersionId: version.id } });

    await logAudit({
      organizationId: ctx.organizationId, userId: ctx.userId,
      action: "approve", resourceType: "PolicyVersion", resourceId: version.id,
    }, req);

    return NextResponse.json({ version: updatedVersion }, { status: 200 });
  } catch (err) {
    if (err instanceof OrgContextError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
