import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission, assertResourceBelongsToOrg, OrgContextError } from "@/lib/authorize";
import { PERMISSIONS } from "@/lib/permissions";
import { computeRiskScore, validateOverride, type RiskLevel } from "@/lib/riskScoring";
import { logAudit } from "@/lib/audit";

interface RouteParams { params: { id: string } }

const submitAnswersSchema = z.object({
  organizationId: z.string().min(1),
  answers: z.array(z.object({
    riskQuestionId: z.string().min(1),
    value: z.number().int().min(0).max(4),
    comment: z.string().max(1000).optional(),
  })).min(1),
});

const confirmSchema = z.object({
  organizationId: z.string().min(1),
  confirmedLevel: z.enum(["low", "moderate", "high", "critical"]),
  justification: z.string().max(2000).optional(),
});

/** PATCH → soumission des réponses et calcul du score (provisoire, non définitif). */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const body = await req.json().catch(() => null);
  const parsed = submitAnswersSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  try {
    const ctx = await requirePermission(PERMISSIONS.RISK_ASSESS, parsed.data.organizationId);
    await assertResourceBelongsToOrg(prisma.riskAssessment, params.id, ctx.organizationId);

    const questionIds = parsed.data.answers.map((a) => a.riskQuestionId);
    const questions = await prisma.riskQuestion.findMany({ where: { id: { in: questionIds } } });

    const questionMap = new Map(questions.map((q) => [q.id, q]));

    await prisma.$transaction(async (tx) => {
      await tx.riskAnswer.deleteMany({ where: { riskAssessmentId: params.id } });
      for (const answer of parsed.data.answers) {
        await tx.riskAnswer.create({
          data: {
            riskAssessmentId: params.id,
            riskQuestionId: answer.riskQuestionId,
            value: answer.value,
            comment: answer.comment,
          },
        });
      }
    });

    const weightedAnswers = parsed.data.answers.map((a) => ({
      category: questionMap.get(a.riskQuestionId)?.category ?? "unknown",
      value: a.value,
      weight: questionMap.get(a.riskQuestionId)?.weight ?? 1,
    }));

    const result = computeRiskScore(weightedAnswers);

    const score = await prisma.riskScore.upsert({
      where: { riskAssessmentId: params.id },
      create: { riskAssessmentId: params.id, rawScore: result.rawScore, level: result.level },
      update: { rawScore: result.rawScore, level: result.level, computedAt: new Date() },
    });

    await prisma.riskAssessment.update({ where: { id: params.id }, data: { status: "scored" } });

    await logAudit({
      organizationId: ctx.organizationId, userId: ctx.userId,
      action: "update", resourceType: "RiskAssessment", resourceId: params.id,
      newState: { score: result },
    }, req);

    return NextResponse.json({ score, breakdown: result.breakdown }, { status: 200 });
  } catch (err) {
    if (err instanceof OrgContextError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

/**
 * PUT → confirmation humaine finale, OBLIGATOIRE avant que le niveau ne soit considéré définitif.
 * Aucun autre endpoint ne doit permettre de passer status="confirmed" sans passer par cette route.
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const body = await req.json().catch(() => null);
  const parsed = confirmSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  try {
    // Confirmer/modifier un score est une action distincte de la simple évaluation → permission dédiée.
    const ctx = await requirePermission(PERMISSIONS.RISK_OVERRIDE, parsed.data.organizationId);
    await assertResourceBelongsToOrg(prisma.riskAssessment, params.id, ctx.organizationId);

    const score = await prisma.riskScore.findUnique({ where: { riskAssessmentId: params.id } });
    if (!score) {
      return NextResponse.json({ error: "no_score_computed_yet" }, { status: 400 });
    }

    const validation = validateOverride(
      score.level as RiskLevel,
      parsed.data.confirmedLevel,
      parsed.data.justification
    );

    if (!validation.valid) {
      return NextResponse.json({ error: "invalid_override", message: validation.reason }, { status: 400 });
    }

    const isOverride = score.level !== parsed.data.confirmedLevel;

    const updatedScore = await prisma.riskScore.update({
      where: { riskAssessmentId: params.id },
      data: {
        level: parsed.data.confirmedLevel,
        overriddenByUserId: isOverride ? ctx.userId : null,
        overrideJustification: isOverride ? parsed.data.justification : null,
      },
    });

    const assessment = await prisma.riskAssessment.update({
      where: { id: params.id },
      data: { status: "confirmed", confirmedByUserId: ctx.userId, justification: parsed.data.justification },
    });

    await logAudit({
      organizationId: ctx.organizationId, userId: ctx.userId,
      action: "risk_score_change", resourceType: "RiskAssessment", resourceId: params.id,
      oldState: { level: score.level }, newState: { level: updatedScore.level, override: isOverride },
    }, req);

    return NextResponse.json({ assessment, score: updatedScore }, { status: 200 });
  } catch (err) {
    if (err instanceof OrgContextError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
