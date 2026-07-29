import { NextRequest } from "next/server";
import { prisma } from "./prisma";

interface AuditEntry {
  organizationId: string;
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  oldState?: unknown;
  newState?: unknown;
  result?: "success" | "failure";
}

/** Extrait l'IP cliente depuis les en-têtes de confiance (proxy Hostinger/Cloudflare). */
export function extractClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return (forwarded.split(",")[0] ?? "unknown").trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Point d'entrée unique pour écrire une entrée d'audit.
 * `ipAddress` est dérivé côté serveur via extractClientIp — jamais transmis par le client dans le corps JSON.
 */
export async function logAudit(entry: AuditEntry, req?: NextRequest): Promise<void> {
  await prisma.auditLog.create({
    data: {
      organizationId: entry.organizationId,
      userId: entry.userId,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      oldState: entry.oldState ? JSON.stringify(entry.oldState) : undefined,
      newState: entry.newState ? JSON.stringify(entry.newState) : undefined,
      ipAddress: req ? extractClientIp(req) : undefined,
      result: entry.result ?? "success",
    },
  });
}
