import { z } from "zod";

export const aiToolSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(1).max(200),
  aiProviderId: z.string().optional(),
  category: z.string().max(100).optional(),
  description: z.string().max(5000).optional(),
  model: z.string().max(100).optional(),
  version: z.string().max(50).optional(),
  ownerUserId: z.string().optional(),
  startDate: z.coerce.date().optional(),
  status: z.enum(["active", "under_review", "deprecated"]).default("active"),
  estimatedCost: z.number().nonnegative().optional(),
  dataTypesProcessed: z.string().max(2000).optional(),
  personalDataInvolved: z.boolean().default(false),
  termsUrl: z.string().url().optional(),
  privacyPolicyUrl: z.string().url().optional(),
  dataLocation: z.string().max(200).optional(),
  criticality: z.enum(["low", "moderate", "high", "critical"]).default("low"),
  nextReviewDate: z.coerce.date().optional(),
});

export type AiToolInput = z.infer<typeof aiToolSchema>;
