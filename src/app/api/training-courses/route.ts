import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, OrgContextError } from "@/lib/authorize";
import { PERMISSIONS } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  try {
    const orgId = req.nextUrl.searchParams.get("organizationId") ?? undefined;
    const ctx = await requirePermission(PERMISSIONS.TRAINING_TAKE, orgId);

    const courses = await prisma.trainingCourse.findMany({
      where: { OR: [{ organizationId: null }, { organizationId: ctx.organizationId }] },
      orderBy: { title: "asc" },
      include: { modules: { include: { quiz: true }, orderBy: { orderIndex: "asc" } } },
    });

    return NextResponse.json({ items: courses }, { status: 200 });
  } catch (err) {
    if (err instanceof OrgContextError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
