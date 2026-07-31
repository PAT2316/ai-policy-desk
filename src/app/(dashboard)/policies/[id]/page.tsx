import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission, assertResourceBelongsToOrg } from "@/lib/authorize";
import { PERMISSIONS } from "@/lib/permissions";
import { ApprovePolicyButton } from "./ApprovePolicyButton";

export default async function PolicyDetailPage({ params }: { params: { id: string } }) {
  const ctx = await requirePermission(PERMISSIONS.POLICY_VIEW);
  await assertResourceBelongsToOrg(prisma.policy, params.id, ctx.organizationId);

  const policy = await prisma.policy.findUnique({
    where: { id: params.id },
    include: { versions: { orderBy: { versionNumber: "desc" } } },
  });
  if (!policy) notFound();

  const latestVersion = policy.versions[0];
  const content = latestVersion ? (JSON.parse(latestVersion.contentJson) as { text: string }).text : "";

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-semibold">{policy.title}</h1>
        <Link href={`/policies/new`} className="text-sm text-gray-500 underline">
          Générer une nouvelle version
        </Link>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Version {latestVersion?.versionNumber} · Statut : {policy.status === "approved" ? "Approuvée" : "Brouillon"}
      </p>

      {latestVersion?.generatedByAi && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-xs text-blue-800 mb-4">
          Ce contenu a été généré par IA. Il doit être relu et validé avant toute publication officielle.
        </div>
      )}

      <div className="bg-white rounded-lg border p-6 whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
        {content || "Aucun contenu."}
      </div>

      {latestVersion && !latestVersion.approvedAt && (
        <div className="mt-4">
          <ApprovePolicyButton
            policyId={policy.id}
            versionId={latestVersion.id}
            organizationId={ctx.organizationId}
          />
        </div>
      )}
      {latestVersion?.approvedAt && (
        <p className="text-sm text-green-700 mt-4">
          ✓ Version approuvée le {new Date(latestVersion.approvedAt).toLocaleDateString("fr-FR")}
        </p>
      )}
    </div>
  );
}
