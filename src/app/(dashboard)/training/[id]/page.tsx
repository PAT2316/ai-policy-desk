import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission, assertResourceBelongsToOrg } from "@/lib/authorize";
import { PERMISSIONS } from "@/lib/permissions";
import { QuizForm } from "./QuizForm";

export default async function TrainingDetailPage({ params }: { params: { id: string } }) {
  const ctx = await requirePermission(PERMISSIONS.TRAINING_TAKE);
  await assertResourceBelongsToOrg(prisma.trainingAssignment, params.id, ctx.organizationId);

  const assignment = await prisma.trainingAssignment.findUnique({
    where: { id: params.id },
    include: {
      course: {
        include: { modules: { include: { quiz: { include: { questions: true } } }, orderBy: { orderIndex: "asc" } } },
      },
      attempts: { orderBy: { attemptedAt: "desc" }, take: 1 },
    },
  });
  if (!assignment || assignment.userId !== ctx.userId) notFound();

  const module_ = assignment.course.modules[0];
  const quiz = module_?.quiz;
  const lastAttempt = assignment.attempts[0];

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold mb-1">{assignment.course.title}</h1>
      <p className="text-sm text-gray-500 mb-6">{assignment.course.description}</p>

      {module_ && (
        <div className="bg-white rounded-lg border p-6 mb-6">
          <p className="text-sm font-medium mb-2">{module_.title}</p>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{module_.content}</p>
        </div>
      )}

      {assignment.status === "completed" ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <p className="text-green-800 font-medium">Formation terminée ✓</p>
          {lastAttempt && <p className="text-sm text-green-700 mt-1">Score : {lastAttempt.score}%</p>}
        </div>
      ) : quiz ? (
        <QuizForm
          assignmentId={assignment.id}
          organizationId={ctx.organizationId}
          quizId={quiz.id}
          passingScore={quiz.passingScore}
          questions={quiz.questions.map((q) => ({
            id: q.id,
            text: q.text,
            options: JSON.parse(q.optionsJson) as string[],
          }))}
        />
      ) : (
        <p className="text-sm text-gray-500">Cette formation ne comporte pas de quiz.</p>
      )}
    </div>
  );
}
