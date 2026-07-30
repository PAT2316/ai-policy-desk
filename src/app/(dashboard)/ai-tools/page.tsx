import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authorize";
import { PERMISSIONS } from "@/lib/permissions";

const CRITICALITY_LABEL: Record<string, string> = {
  low: "Faible",
  moderate: "Modérée",
  high: "Élevée",
  critical: "Critique",
};

const CRITICALITY_COLOR: Record<string, string> = {
  low: "bg-gray-100 text-gray-700",
  moderate: "bg-blue-100 text-blue-700",
  high: "bg-amber-100 text-amber-800",
  critical: "bg-red-100 text-red-700",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Actif",
  under_review: "En révision",
  deprecated: "Retiré",
};

export default async function AiToolsPage() {
  const ctx = await requirePermission(PERMISSIONS.AI_TOOL_VIEW);

  const tools = await prisma.aiTool.findMany({
    where: { organizationId: ctx.organizationId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Outils d'IA</h1>
        <Link
          href="/ai-tools/new"
          className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-md"
        >
          + Ajouter un outil
        </Link>
      </div>

      {tools.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-gray-500">
          Aucun outil d'IA recensé pour l'instant. Commence par en ajouter un.
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b text-left text-gray-500">
              <tr>
                <th className="px-4 py-2 font-medium">Nom</th>
                <th className="px-4 py-2 font-medium">Catégorie</th>
                <th className="px-4 py-2 font-medium">Statut</th>
                <th className="px-4 py-2 font-medium">Criticité</th>
                <th className="px-4 py-2 font-medium">Données personnelles</th>
              </tr>
            </thead>
            <tbody>
              {tools.map((tool) => (
                <tr key={tool.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium text-gray-900">{tool.name}</td>
                  <td className="px-4 py-3 text-gray-600">{tool.category ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{STATUS_LABEL[tool.status] ?? tool.status}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block text-xs font-medium px-2 py-1 rounded ${
                        CRITICALITY_COLOR[tool.criticality] ?? "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {CRITICALITY_LABEL[tool.criticality] ?? tool.criticality}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {tool.personalDataInvolved ? "Oui" : "Non"}
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
