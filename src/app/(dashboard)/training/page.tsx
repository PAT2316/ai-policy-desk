import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authorize";
import { PERMISSIONS } from "@/lib/permissions";

const STATUS_LABEL: Record<string, string> = {
  assigned: "À faire",
  in_progress: "En cours",
  completed: "Terminée",
};

const STATUS_COLOR: Record<string, string> = {
  assigned: "bg-amber-100 text-amber-800",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
};

export default async function TrainingPage() {
  const ctx = await requirePermission(PERMISSIONS.TRAINING_TAKE);

  const canManage = Boolean(
    await prisma.rolePermission.findFirst({
      where: { roleId: ctx.roleId, permission: { code: PERMISSIONS.TRAINING_MANAGE } },
    })
  );

  const assignments = await prisma.trainingAssignment.findMany({
    where: { organizationId: ctx.organizationId, userId: ctx.userId },
    orderBy: { createdAt: "desc" },
    include: { course: true },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Mes formations</h1>
        {canManage && (
          <Link
            href="/training/assign"
            className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            + Assigner une formation
          </Link>
        )}
      </div>

      {assignments.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-gray-500">
          Aucune formation ne t'a été assignée pour l'instant.
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <Link
              key={a.id}
              href={`/training/${a.id}`}
              className="block bg-white rounded-lg border p-4 hover:border-gray-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{a.course.title}</p>
                  {a.dueDate && (
                    <p className="text-xs text-gray-500 mt-1">
                      À terminer avant le {new Date(a.dueDate).toLocaleDateString("fr-FR")}
                    </p>
                  )}
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded ${
                    STATUS_COLOR[a.status] ?? "bg-gray-100 text-gray-700"
                  }`}
                >
                  {STATUS_LABEL[a.status] ?? a.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
