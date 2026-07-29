import { z } from "zod";

export const correctiveActionSchema = z.object({
  organizationId: z.string().min(1),
  incidentId: z.string().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  sourceProblem: z.string().max(2000).optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  ownerUserId: z.string().optional(),
  dueDate: z.coerce.date().optional(),
});

export const completeActionSchema = z.object({
  organizationId: z.string().min(1),
  proofDocumentId: z.string().min(1), // preuve obligatoire pour clôturer (cahier des charges §K)
  comment: z.string().max(2000).optional(),
});
