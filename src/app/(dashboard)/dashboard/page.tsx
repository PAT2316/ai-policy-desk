import { getOrgContext } from "@/lib/orgContext";
import { getDashboardMetrics } from "@/lib/dashboardAggregations";

function MetricCard({ label, value, alert }: { label: string; value: number; alert?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${alert && value > 0 ? "border-amber-300 bg-amber-50" : "bg-white"}`}>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const ctx = await getOrgContext();
  const metrics = await getDashboardMetrics(ctx.organizationId);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Tableau de bord</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Outils d'IA recensés" value={metrics.aiToolsCount} />
        <MetricCard label="Cas d'usage" value={metrics.useCasesCount} />
        <MetricCard label="Risques élevés/critiques" value={metrics.highOrCriticalRisksCount} alert />
        <MetricCard label="Formations en retard" value={metrics.overdueTrainingsCount} alert />
        <MetricCard label="Incidents ouverts" value={metrics.openIncidentsCount} alert />
        <MetricCard label="Actions en retard" value={metrics.overdueActionsCount} alert />
        <MetricCard label="Évaluations expirées" value={metrics.expiredAssessmentsCount} alert />
        <MetricCard label="Documents expirant bientôt" value={metrics.documentsExpiringSoonCount} alert />
      </div>

      {metrics.aiToolsCount === 0 && metrics.useCasesCount === 0 && (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-gray-500 mb-8">
          Aucune donnée pour l'instant. Commence par déclarer ton premier outil d'IA depuis le menu
          « Outils d'IA ».
        </div>
      )}

      {metrics.usageByDepartment.length > 0 && (
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm font-medium mb-3">Répartition des cas d'usage par département</p>
          <ul className="space-y-1">
            {metrics.usageByDepartment.map((d) => (
              <li key={d.departmentName} className="text-sm text-gray-600 flex justify-between">
                <span>{d.departmentName}</span>
                <span className="font-medium">{d.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
