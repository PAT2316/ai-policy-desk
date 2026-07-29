import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveEmailProvider } from "@/lib/email/BrevoProvider";
import { shouldNotify, buildDeduplicationKey } from "@/lib/notificationRules";

const emailProvider = getActiveEmailProvider();

/** Route interne cron (ADR-007) — traite les formations en retard, exemple représentatif des autres règles. */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  let createdCount = 0;

  const overdueAssignments = await prisma.trainingAssignment.findMany({
    where: { status: { not: "completed" }, dueDate: { not: null } },
    include: { organization: true },
  });

  for (const assignment of overdueAssignments) {
    if (!assignment.dueDate) continue;

    const { notify } = shouldNotify({ id: assignment.id, dueOrReviewDate: assignment.dueDate }, now);
    if (!notify) continue;

    const dedupKey = buildDeduplicationKey("training_overdue", assignment.id, now);

    // Idempotence : on ne crée pas de doublon pour la même clé le même jour.
    const alreadyNotified = await prisma.notification.findFirst({
      where: { organizationId: assignment.organizationId, type: "training_overdue", payloadJson: { contains: dedupKey } },
    });
    if (alreadyNotified) continue;

    await prisma.notification.create({
      data: {
        organizationId: assignment.organizationId,
        userId: assignment.userId,
        type: "training_overdue",
        payloadJson: JSON.stringify({ assignmentId: assignment.id, dedupKey }),
      },
    });

    const user = await prisma.user.findUnique({ where: { id: assignment.userId } });
    if (user) {
      await emailProvider.send({
        to: user.email,
        template: "training_overdue",
        locale: user.locale,
        variables: { name: user.name },
      });
    }

    createdCount += 1;
  }

  console.info(JSON.stringify({ job: "notifications", createdCount, executedAt: now.toISOString() }));

  return NextResponse.json({ createdCount }, { status: 200 });
}
