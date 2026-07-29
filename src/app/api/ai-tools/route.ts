import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, OrgContextError } from "@/lib/authorize";
import { PERMISSIONS } from "@/lib/permissions";
import { aiToolSchema } from "@/lib/aiToolSchema";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const orgId = req.nextUrl.searchParams.get("organizationId") ?? undefined;
    const ctx = await requirePermission(PERMISSIONS.AI_TOOL_VIEW, orgId);

    const criticality = req.nextUrl.searchParams.get("criticality") ?? undefined;
    const status = req.nextUrl.searchParams.get("status") ?? undefined;
    const page = Number(req.nextUrl.searchParams.get("page") ?? "1");
    const pageSize = 20;

    const [items, total] = await Promise.all([
      prisma.aiTool.findMany({
        where: {
          organizationId: ctx.organizationId,
          deletedAt: null,
          ...(criticality ? { criticality } : {}),
          ...(status ? { status } : {}),
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.aiTool.count({ where: { organizationId: ctx.organizationId, deletedAt: null } }),
    ]);

    return NextResponse.json({ items, total, page, pageSize }, { status: 200 });
  } catch (err) {
    if (err instanceof OrgContextError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = aiToolSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const ctx = await requirePermission(PERMISSIONS.AI_TOOL_CREATE, parsed.data.organizationId);

    // Si un fournisseur est référencé, vérifier qu'il appartient bien à la même organisation.
    if (parsed.data.aiProviderId) {
      const provider = await prisma.aiProvider.findUnique({ where: { id: parsed.data.aiProviderId } });
      if (!provider || provider.organizationId !== ctx.organizationId) {
        return NextResponse.json({ error: "invalid_ai_provider" }, { status: 400 });
      }
    }

    const tool = await prisma.aiTool.create({ data: { ...parsed.data, organizationId: ctx.organizationId } });

    await logAudit({
      organizationId: ctx.organizationId, userId: ctx.userId,
      action: "create", resourceType: "AiTool", resourceId: tool.id, newState: tool,
    }, req);

    return NextResponse.json({ tool }, { status: 201 });
  } catch (err) {
    if (err instanceof OrgContextError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
