import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authorize";
import { PERMISSIONS } from "@/lib/permissions";
import { NewUseCaseForm } from "./NewUseCaseForm";

export default async function NewUseCasePage() {
  const ctx = await requirePermission(PERMISSIONS.USE_CASE_CREATE);

  const aiTools = await prisma.aiTool.findMany({
    where: { organizationId: ctx.organizationId, deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold mb-6">Ajouter un cas d'usage</h1>
      <NewUseCaseForm organizationId={ctx.organizationId} aiTools={aiTools} />
    </div>
  );
}
