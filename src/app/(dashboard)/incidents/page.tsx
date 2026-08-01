import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authorize";
import { PERMISSIONS } from "@/lib/permissions";
import { IncidentStatusActions } from "./IncidentStatusActions";

const STATUS_LABEL: Record<string, string> = {
  open: "Ouvert",
  investigating: "En investigation",
  resolved: "Résolu",
  closed: "Clôturé",
};

const SEVERITY_LABEL: Record<string, string> = {
  low: "Faible",
  moderate: "Modérée",
  high: "Élevée",
  critical: "Critique",
};

const SEVERITY_COLOR: Record<string, string> = {
  low: "bg-gray-100 text-gray-700",
  moderate: "bg-blue-100 text-blue-700",
  high: "bg-amber-100 text-amber-800",
  critical: "bg-red-100 text-red-700",
};

export default async function IncidentsPage() {
  const ctx = await requirePermission(PERMISSIONS.INCIDENT_VIEW);

  const incidents = await prisma.incident.findMany({
    where: { organizationId: ctx.organizationId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Incidents</h1>
        <Link
          href="/incidents/new"
          className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-md"
        >
          + Déclarer un incident
        </Link>
      </div>

      {incidents.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-gray-500">
          Aucun incident déclaré. C'est plutôt bon signe.
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((inc) => (
            <div key={inc.id} className="bg-white rounded-lg border p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-gray-900">{inc.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(inc.date).toLocaleDateString("fr-FR")} · {STATUS_LABEL[inc.status] ?? inc.status}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">{inc.description}</p>
                  {inc.immediateActions && (
                    <p className="text-xs text-gray-500 mt-2">
                      Actions immédiates : {inc.immediateActions}
                    </p>
                  )}
                </div>
                <span
                  className={`shrink-0 text-xs font-medium px-2 py-1 rounded ${
                    SEVERITY_COLOR[inc.severity] ?? "bg-gray-100 text-gray-700"
                  }`}
                >
                  {SEVERITY_LABEL[inc.severity] ?? inc.severity}
                </span>
              </div>
              <div className="mt-3">
                <IncidentStatusActions
                  incidentId={inc.id}
                  organizationId={ctx.organizationId}
                  currentStatus={inc.status}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
