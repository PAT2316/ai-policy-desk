import { requirePermission } from "@/lib/authorize";
import { PERMISSIONS } from "@/lib/permissions";
import { NewAiToolForm } from "./NewAiToolForm";

export default async function NewAiToolPage() {
  const ctx = await requirePermission(PERMISSIONS.AI_TOOL_CREATE);

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold mb-6">Ajouter un outil d'IA</h1>
      <NewAiToolForm organizationId={ctx.organizationId} />
    </div>
  );
}
