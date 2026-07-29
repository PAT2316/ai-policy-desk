import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission, OrgContextError } from "@/lib/authorize";
import { PERMISSIONS } from "@/lib/permissions";
import { getDashboardMetrics } from "@/lib/dashboardAggregations";
import { logAudit } from "@/lib/audit";

const generateSchema = z.object({
  organizationId: z.string().min(1),
  type: z.enum(["dashboard_export", "risk_summary", "training_status", "incident_summary"]),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  try {
    // REPORT_VIEW est délibérément accordé à Auditor (cf. matrice de permissions M2) : un rapport
    // est une opération de lecture agrégée, pas une écriture.
    const ctx = await requirePermission(PERMISSIONS.REPORT_VIEW, parsed.data.organizationId);

    const metrics = await getDashboardMetrics(ctx.organizationId);

    const report = await prisma.report.create({
      data: {
        organizationId: ctx.organizationId,
        type: parsed.data.type,
        generatedByUserId: ctx.userId,
        parametersJson: JSON.stringify({ metrics }),
      },
    });

    await logAudit({
      organizationId: ctx.organizationId, userId: ctx.userId,
      action: "export", resourceType: "Report", resourceId: report.id,
    }, req);

    return NextResponse.json({ report }, { status: 201 });
  } catch (err) {
    if (err instanceof OrgContextError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
