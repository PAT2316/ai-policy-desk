import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authorize";
import { PERMISSIONS } from "@/lib/permissions";

const LEVEL_LABEL: Record<string, string> = {
  low: "Faible",
  moderate: "Modéré",
  high: "Élevé",
  critical: "Critique",
};

const LEVEL_COLOR: Record<string, string> = {
  low: "bg-gray-100 text-gray-700",
  moderate: "bg-blue-100 text-blue-700",
  high: "bg-amber-100 text-amber-800",
  critical: "bg-red-100 text-red-700",
};

const STATUS_LABEL: Record<string, string> = {
  in_progress: "En cours",
  scored: "Score calculé — à confirmer",
  confirmed: "Confirmé",
};

export default async function RiskAssessmentsPage() {
  const ctx = await requirePermission(PERMISSIONS.RISK_VIEW);

  const assessments = await prisma.riskAssessment.findMany({
    where: { organizationId: ctx.organizationId },
    orderBy: { createdAt: "desc" },
    include: { useCase: { select: { title: true } }, score: true },
  });

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Évaluations de risque</h1>

      {assessments.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-gray-500">
          Aucune évaluation pour l'instant. Démarre-en une depuis la page « Cas d'usage ».
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b text-left text-gray-500">
              <tr>
                <th className="px-4 py-2 font-medium">Cas d'usage</th>
                <th className="px-4 py-2 font-medium">Statut</th>
                <th className="px-4 py-2 font-medium">Niveau de risque</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {assessments.map((a) => (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium text-gray-900">{a.useCase.title}</td>
                  <td className="px-4 py-3 text-gray-600">{STATUS_LABEL[a.status] ?? a.status}</td>
                  <td className="px-4 py-3">
                    {a.score ? (
                      <span
                        className={`inline-block text-xs font-medium px-2 py-1 rounded ${
                          LEVEL_COLOR[a.score.level] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {LEVEL_LABEL[a.score.level] ?? a.score.level} ({a.score.rawScore}/100)
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/risk-assessments/${a.id}`} className="text-gray-900 underline text-sm">
                      Ouvrir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
