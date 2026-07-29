import { prisma } from "./prisma";

export interface DashboardMetrics {
  aiToolsCount: number;
  useCasesCount: number;
  unapprovedToolsCount: number;
  highOrCriticalRisksCount: number;
  expiredAssessmentsCount: number;
  overdueTrainingsCount: number;
  openIncidentsCount: number;
  overdueActionsCount: number;
  documentsExpiringSoonCount: number;
  usageByDepartment: { departmentName: string; count: number }[];
}

const EXPIRING_SOON_DAYS = 30;

/**
 * Toutes les requêtes filtrent explicitement par organizationId — aucune agrégation globale
 * n'est jamais exposée par cet endpoint (cf. Phase 2 ADR-001).
 */
export async function getDashboardMetrics(organizationId: string): Promise<DashboardMetrics> {
  const now = new Date();
  const soon = new Date(now.getTime() + EXPIRING_SOON_DAYS * 24 * 60 * 60 * 1000);

  const [
    aiToolsCount,
    useCasesCount,
    unapprovedToolsCount,
    highOrCriticalRisksCount,
    expiredAssessmentsCount,
    overdueTrainingsCount,
    openIncidentsCount,
    overdueActionsCount,
    documentsExpiringSoonCount,
    departmentGroups,
  ] = await Promise.all([
    prisma.aiTool.count({ where: { organizationId, deletedAt: null } }),
    prisma.useCase.count({ where: { organizationId, deletedAt: null } }),
    prisma.aiTool.count({ where: { organizationId, deletedAt: null, status: "under_review" } }),
    prisma.riskScore.count({
      where: { level: { in: ["high", "critical"] }, riskAssessment: { organizationId } },
    }),
    prisma.riskAssessment.count({
      where: { organizationId, useCase: { reviewDate: { lt: now } } },
    }),
    prisma.trainingAssignment.count({
      where: { organizationId, status: { not: "completed" }, dueDate: { lt: now } },
    }),
    prisma.incident.count({ where: { organizationId, status: { in: ["open", "investigating"] } } }),
    prisma.correctiveAction.count({
      where: { organizationId, status: { not: "done" }, dueDate: { lt: now } },
    }),
    prisma.document.count({
      where: { organizationId, deletedAt: null, expirationDate: { gte: now, lte: soon } },
    }),
    prisma.useCase.groupBy({
      by: ["departmentId"],
      where: { organizationId, deletedAt: null, departmentId: { not: null } },
      _count: { _all: true },
    }),
  ]);

  const departmentIds = departmentGroups.map((g) => g.departmentId).filter(Boolean) as string[];
  const departments = await prisma.department.findMany({ where: { id: { in: departmentIds } } });
  const departmentNameMap = new Map(departments.map((d) => [d.id, d.name]));

  const usageByDepartment = departmentGroups.map((g) => ({
    departmentName: departmentNameMap.get(g.departmentId!) ?? "Inconnu",
    count: g._count._all,
  }));

  return {
    aiToolsCount,
    useCasesCount,
    unapprovedToolsCount,
    highOrCriticalRisksCount,
    expiredAssessmentsCount,
    overdueTrainingsCount,
    openIncidentsCount,
    overdueActionsCount,
    documentsExpiringSoonCount,
    usageByDepartment,
  };
}
