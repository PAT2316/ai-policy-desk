import { z } from "zod";

export const incidentSchema = z.object({
  organizationId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  date: z.coerce.date(),
  aiToolId: z.string().optional(),
  useCaseId: z.string().optional(),
  dataConcerned: z.string().max(2000).optional(),
  impact: z.string().max(2000).optional(),
  severity: z.enum(["low", "moderate", "high", "critical"]).default("moderate"),
  immediateActions: z.string().max(2000).optional(),
  ownerUserId: z.string().optional(),
});

export const incidentStatusSchema = z.object({
  organizationId: z.string().min(1),
  status: z.enum(["open", "investigating", "resolved", "closed"]),
});

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  open: ["investigating", "closed"],
  investigating: ["resolved", "open"],
  resolved: ["closed", "investigating"],
  closed: [], // état terminal, aucune réouverture directe (créer un nouvel incident si récidive)
};

export function isValidIncidentTransition(from: string, to: string): boolean {
  return (ALLOWED_TRANSITIONS[from] ?? []).includes(to);
}
