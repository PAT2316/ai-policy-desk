import { NextRequest, NextResponse } from "next/server";
import { requirePermission, OrgContextError } from "@/lib/authorize";
import { PERMISSIONS } from "@/lib/permissions";
import { getDashboardMetrics } from "@/lib/dashboardAggregations";

export async function GET(req: NextRequest) {
  try {
    const orgId = req.nextUrl.searchParams.get("organizationId") ?? undefined;
    // Le tableau de bord agrège des données de plusieurs modules ; on exige la permission
    // la plus largement détenue (AI_TOOL_VIEW) — un Auditor y a accès en lecture, un Employee non.
    const ctx = await requirePermission(PERMISSIONS.AI_TOOL_VIEW, orgId);

    const metrics = await getDashboardMetrics(ctx.organizationId);
    return NextResponse.json({ metrics }, { status: 200 });
  } catch (err) {
    if (err instanceof OrgContextError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
