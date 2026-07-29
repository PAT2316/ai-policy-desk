export type NotificationType =
  | "use_case_review"
  | "assessment_renewal"
  | "document_expiring"
  | "training_overdue"
  | "action_overdue"
  | "incident_assigned"
  | "approval_requested"
  | "risk_changed";

export interface DateBasedItem {
  id: string;
  dueOrReviewDate: Date;
}

const EXPIRING_WINDOW_DAYS = 30;

/**
 * Détermine si un item date-based doit déclencher une notification "à venir" ou "en retard".
 * Logique pure, sans accès DB, pour permettre des tests exhaustifs sur les cas limites de dates.
 */
export function shouldNotify(item: DateBasedItem, now: Date = new Date()): { notify: boolean; reason?: "upcoming" | "overdue" } {
  const diffDays = (item.dueOrReviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return { notify: true, reason: "overdue" };
  if (diffDays <= EXPIRING_WINDOW_DAYS) return { notify: true, reason: "upcoming" };
  return { notify: false };
}

/** Clé de déduplication pour garantir l'idempotence du cron (une notification par jour/item/type max). */
export function buildDeduplicationKey(type: NotificationType, itemId: string, now: Date = new Date()): string {
  const dayKey = now.toISOString().slice(0, 10);
  return `${type}:${itemId}:${dayKey}`;
}
