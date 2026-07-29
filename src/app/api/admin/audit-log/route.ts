import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, OrgContextError } from "@/lib/authorize";
import { PERMISSIONS } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  try {
    const orgId = req.nextUrl.searchParams.get("organizationId") ?? undefined;
    const ctx = await requirePermission(PERMISSIONS.AUDIT_LOG_VIEW, orgId);

    const resourceType = req.nextUrl.searchParams.get("resourceType") ?? undefined;
    const page = Number(req.nextUrl.searchParams.get("page") ?? "1");
    const pageSize = 50;

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { organizationId: ctx.organizationId, ...(resourceType ? { resourceType } : {}) },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.auditLog.count({ where: { organizationId: ctx.organizationId } }),
    ]);

    return NextResponse.json({ items, total, page, pageSize }, { status: 200 });
  } catch (err) {
    if (err instanceof OrgContextError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
