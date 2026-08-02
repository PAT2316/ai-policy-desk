import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission, OrgContextError } from "@/lib/authorize";
import { PERMISSIONS } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

const assignSchema = z.object({
  organizationId: z.string().min(1),
  trainingCourseId: z.string().min(1),
  userId: z.string().min(1),
  dueDate: z.coerce.date().optional(),
});

/**
 * GET : liste les assignations de l'organisation. `?mine=true` limite à celles de
 * l'utilisateur courant (utilisé par la page « Mes formations »).
 */
export async function GET(req: NextRequest) {
  try {
    const orgId = req.nextUrl.searchParams.get("organizationId") ?? undefined;
    const ctx = await requirePermission(PERMISSIONS.TRAINING_TAKE, orgId);
    const mineOnly = req.nextUrl.searchParams.get("mine") === "true";

    const items = await prisma.trainingAssignment.findMany({
      where: {
        organizationId: ctx.organizationId,
        ...(mineOnly ? { userId: ctx.userId } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        course: { include: { modules: { include: { quiz: true }, orderBy: { orderIndex: "asc" } } } },
      },
    });

    return NextResponse.json({ items }, { status: 200 });
  } catch (err) {
    if (err instanceof OrgContextError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

/** POST : assigne une formation à un membre de l'organisation. Réservé à TRAINING_MANAGE. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = assignSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  try {
    const ctx = await requirePermission(PERMISSIONS.TRAINING_MANAGE, parsed.data.organizationId);

    // Vérifie que l'utilisateur ciblé appartient bien à l'organisation.
    const membership = await prisma.membership.findFirst({
      where: { userId: parsed.data.userId, organizationId: ctx.organizationId },
    });
    if (!membership) {
      return NextResponse.json({ error: "user_not_in_organization" }, { status: 400 });
    }

    const assignment = await prisma.trainingAssignment.create({
      data: {
        organizationId: ctx.organizationId,
        trainingCourseId: parsed.data.trainingCourseId,
        userId: parsed.data.userId,
        assignedByUserId: ctx.userId,
        dueDate: parsed.data.dueDate,
        status: "assigned",
      },
    });

    await logAudit(
      {
        organizationId: ctx.organizationId,
        userId: ctx.userId,
        action: "create",
        resourceType: "TrainingAssignment",
        resourceId: assignment.id,
        newState: assignment,
      },
      req
    );

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (err) {
    if (err instanceof OrgContextError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
