import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, assertResourceBelongsToOrg, OrgContextError } from "@/lib/authorize";
import { PERMISSIONS } from "@/lib/permissions";
import { aiToolSchema } from "@/lib/aiToolSchema";
import { logAudit } from "@/lib/audit";

interface RouteParams { params: { id: string } }

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const orgId = req.nextUrl.searchParams.get("organizationId") ?? undefined;
    const ctx = await requirePermission(PERMISSIONS.AI_TOOL_VIEW, orgId);
    await assertResourceBelongsToOrg(prisma.aiTool, params.id, ctx.organizationId);

    const tool = await prisma.aiTool.findUnique({ where: { id: params.id } });
    return NextResponse.json({ tool }, { status: 200 });
  } catch (err) {
    if (err instanceof OrgContextError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const body = await req.json().catch(() => null);
  const parsed = aiToolSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  try {
    const ctx = await requirePermission(PERMISSIONS.AI_TOOL_EDIT, parsed.data.organizationId);
    await assertResourceBelongsToOrg(prisma.aiTool, params.id, ctx.organizationId);

    const before = await prisma.aiTool.findUnique({ where: { id: params.id } });
    const tool = await prisma.aiTool.update({ where: { id: params.id }, data: parsed.data });

    await logAudit({
      organizationId: ctx.organizationId, userId: ctx.userId,
      action: "update", resourceType: "AiTool", resourceId: tool.id, oldState: before, newState: tool,
    }, req);

    return NextResponse.json({ tool }, { status: 200 });
  } catch (err) {
    if (err instanceof OrgContextError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const orgId = req.nextUrl.searchParams.get("organizationId") ?? undefined;
  try {
    const ctx = await requirePermission(PERMISSIONS.AI_TOOL_DELETE, orgId);
    await assertResourceBelongsToOrg(prisma.aiTool, params.id, ctx.organizationId);

    const tool = await prisma.aiTool.update({ where: { id: params.id }, data: { deletedAt: new Date() } });

    await logAudit({
      organizationId: ctx.organizationId, userId: ctx.userId,
      action: "delete", resourceType: "AiTool", resourceId: tool.id,
    }, req);

    return NextResponse.json({ message: "Outil supprimé." }, { status: 200 });
  } catch (err) {
    if (err instanceof OrgContextError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
