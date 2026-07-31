import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission, assertResourceBelongsToOrg } from "@/lib/authorize";
import { PERMISSIONS } from "@/lib/permissions";
import { RiskAssessmentForm } from "./RiskAssessmentForm";

export default async function RiskAssessmentDetailPage({ params }: { params: { id: string } }) {
  const ctx = await requirePermission(PERMISSIONS.RISK_VIEW);
  await assertResourceBelongsToOrg(prisma.riskAssessment, params.id, ctx.organizationId);

  const assessment = await prisma.riskAssessment.findUnique({
    where: { id: params.id },
    include: {
      useCase: { select: { title: true } },
      score: true,
      answers: true,
    },
  });
  if (!assessment) notFound();

  const questions = await prisma.riskQuestion.findMany({
    where: { OR: [{ organizationId: null }, { organizationId: ctx.organizationId }] },
    orderBy: { orderIndex: "asc" },
  });

  const existingAnswers = Object.fromEntries(assessment.answers.map((a) => [a.riskQuestionId, a.value]));

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold mb-1">Évaluation de risque</h1>
      <p className="text-sm text-gray-500 mb-6">Cas d'usage : {assessment.useCase.title}</p>

      <RiskAssessmentForm
        assessmentId={assessment.id}
        organizationId={ctx.organizationId}
        questions={questions}
        existingAnswers={existingAnswers}
        existingScore={assessment.score}
        status={assessment.status}
      />
    </div>
  );
}
