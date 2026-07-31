import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authorize";
import { PERMISSIONS } from "@/lib/permissions";

const STATUS_LABEL: Record<string, string> = {
  draft: "Brouillon",
  approved: "Approuvée",
};

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-700",
};

export default async function PoliciesPage() {
  const ctx = await requirePermission(PERMISSIONS.POLICY_VIEW);

  const policies = await prisma.policy.findMany({
    where: { organizationId: ctx.organizationId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Politiques</h1>
        <Link
          href="/policies/new"
          className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-md"
        >
          + Générer une politique
        </Link>
      </div>

      {policies.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-gray-500">
          Aucune politique pour l'instant. Génère la première à partir d'un questionnaire guidé.
        </div>
      ) : (
        <div className="space-y-3">
          {policies.map((p) => (
            <Link
              key={p.id}
              href={`/policies/${p.id}`}
              className="block bg-white rounded-lg border p-4 hover:border-gray-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{p.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Version {p.versions[0]?.versionNumber ?? "—"} ·{" "}
                    {p.versions[0]?.generatedByAi ? "Générée par IA" : "Manuelle"}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded ${
                    STATUS_COLOR[p.status] ?? "bg-gray-100 text-gray-700"
                  }`}
                >
                  {STATUS_LABEL[p.status] ?? p.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
