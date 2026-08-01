import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authorize";
import { PERMISSIONS } from "@/lib/permissions";
import { NewIncidentForm } from "./NewIncidentForm";

export default async function NewIncidentPage() {
  const ctx = await requirePermission(PERMISSIONS.INCIDENT_CREATE);

  const [aiTools, useCases] = await Promise.all([
    prisma.aiTool.findMany({
      where: { organizationId: ctx.organizationId, deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.useCase.findMany({
      where: { organizationId: ctx.organizationId, deletedAt: null },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
  ]);

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold mb-6">Déclarer un incident</h1>
      <NewIncidentForm organizationId={ctx.organizationId} aiTools={aiTools} useCases={useCases} />
    </div>
  );
}
