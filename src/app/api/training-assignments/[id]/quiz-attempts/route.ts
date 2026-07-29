import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { requirePermission, assertResourceBelongsToOrg, OrgContextError } from "@/lib/authorize";
import { PERMISSIONS } from "@/lib/permissions";
import { scoreQuiz } from "@/lib/quizScoring";
import { logAudit } from "@/lib/audit";

interface RouteParams { params: { id: string } }

const submitSchema = z.object({
  organizationId: z.string().min(1),
  quizId: z.string().min(1),
  answers: z.array(z.object({ questionId: z.string(), submittedAnswer: z.string() })).min(1),
});

export async function POST(req: NextRequest, { params }: RouteParams) {
  const body = await req.json().catch(() => null);
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  try {
    const ctx = await requirePermission(PERMISSIONS.TRAINING_TAKE, parsed.data.organizationId);
    await assertResourceBelongsToOrg(prisma.trainingAssignment, params.id, ctx.organizationId);

    const assignment = await prisma.trainingAssignment.findUniqueOrThrow({ where: { id: params.id } });

    // Un utilisateur ne peut soumettre un quiz que pour SA PROPRE assignation.
    if (assignment.userId !== ctx.userId) {
      return NextResponse.json({ error: "not_your_assignment" }, { status: 403 });
    }

    const quiz = await prisma.quiz.findUniqueOrThrow({ where: { id: parsed.data.quizId } });
    const questions = await prisma.quizQuestion.findMany({ where: { quizId: quiz.id } });

    const result = scoreQuiz(
      parsed.data.answers,
      questions.map((q) => ({ questionId: q.id, correctAnswer: q.correctAnswer })),
      quiz.passingScore
    );

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId: quiz.id,
        trainingAssignmentId: assignment.id,
        userId: ctx.userId,
        score: result.score,
        passed: result.passed,
      },
    });

    if (result.passed) {
      const certificateUrl = `certificates/${assignment.id}-${randomUUID()}.pdf`; // génération réelle du PDF hors scope de cette route
      await prisma.trainingAssignment.update({
        where: { id: assignment.id },
        data: { status: "completed", completedAt: new Date(), certificateUrl },
      });
    }

    await logAudit({
      organizationId: ctx.organizationId, userId: ctx.userId,
      action: "create", resourceType: "QuizAttempt", resourceId: attempt.id,
      newState: { score: result.score, passed: result.passed },
    }, req);

    return NextResponse.json({ attempt, result }, { status: 201 });
  } catch (err) {
    if (err instanceof OrgContextError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
