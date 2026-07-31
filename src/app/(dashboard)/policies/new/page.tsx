import { requirePermission } from "@/lib/authorize";
import { PERMISSIONS } from "@/lib/permissions";
import { GeneratePolicyForm } from "./GeneratePolicyForm";

export default async function NewPolicyPage() {
  const ctx = await requirePermission(PERMISSIONS.POLICY_GENERATE);

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold mb-1">Générer une politique d'utilisation de l'IA</h1>
      <p className="text-sm text-gray-500 mb-6">
        Réponds à ce questionnaire — l'IA génère un brouillon à partir de tes réponses. Le document
        devra toujours être validé par un responsable avant publication.
      </p>
      <GeneratePolicyForm organizationId={ctx.organizationId} />
    </div>
  );
}
