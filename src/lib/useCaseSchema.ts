import { z } from "zod";

export const useCaseSchema = z.object({
  organizationId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  departmentId: z.string().optional(),
  ownerUserId: z.string().optional(),
  businessGoal: z.string().max(2000).optional(),
  aiToolId: z.string().optional(),
  affectedUsers: z.string().max(500).optional(),
  affectedPopulation: z.string().max(500).optional(),
  inputData: z.string().max(2000).optional(),
  outputData: z.string().max(2000).optional(),
  automationLevel: z.enum(["human_in_loop", "semi_automated", "fully_automated"]).optional(),
  humanIntervention: z.string().max(1000).optional(),
  potentialImpact: z.string().max(2000).optional(),
  frequency: z.string().max(100).optional(),
  reviewDate: z.coerce.date().optional(),
});

export const useCaseStatusTransitionSchema = z.object({
  organizationId: z.string().min(1),
  approvalStatus: z.enum(["draft", "pending_approval", "approved", "rejected"]),
});

export type UseCaseInput = z.infer<typeof useCaseSchema>;
