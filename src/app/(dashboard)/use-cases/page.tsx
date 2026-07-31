import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authorize";
import { PERMISSIONS } from "@/lib/permissions";
import { UseCaseStatusActions } from "./UseCaseStatusActions";
import { StartRiskAssessmentButton } from "./StartRiskAssessmentButton";

const STATUS_LABEL: Record<string, string> = {
  draft: "Brouillon",
  pending_approval: "En attente d'approbation",
  approved: "Approuvé",
  rejected: "Rejeté",
};

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  pending_approval: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default async function UseCasesPage() {
  const ctx = await requirePermission(PERMISSIONS.USE_CASE_VIEW);

  const useCases = await prisma.useCase.findMany({
    where: { organizationId: ctx.organizationId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { aiTool: { select: { name: true } }, department: { select: { name: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Cas d'usage</h1>
        <Link
          href="/use-cases/new"
          className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-md"
        >
          + Ajouter un cas d'usage
        </Link>
      </div>

      {useCases.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-gray-500">
          Aucun cas d'usage pour l'instant.
        </div>
      ) : (
        <div className="space-y-3">
          {useCases.map((uc) => (
            <div key={uc.id} className="bg-white rounded-lg border p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-gray-900">{uc.title}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {uc.aiTool?.name && <>Outil : {uc.aiTool.name} · </>}
                    {uc.department?.name && <>Département : {uc.department.name}</>}
                  </p>
                  {uc.description && <p className="text-sm text-gray-600 mt-2">{uc.description}</p>}
                </div>
                <span
                  className={`shrink-0 text-xs font-medium px-2 py-1 rounded ${
                    STATUS_COLOR[uc.approvalStatus] ?? "bg-gray-100 text-gray-700"
                  }`}
                >
                  {STATUS_LABEL[uc.approvalStatus] ?? uc.approvalStatus}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <UseCaseStatusActions
                  useCaseId={uc.id}
                  organizationId={ctx.organizationId}
                  currentStatus={uc.approvalStatus}
                />
                <StartRiskAssessmentButton useCaseId={uc.id} organizationId={ctx.organizationId} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
