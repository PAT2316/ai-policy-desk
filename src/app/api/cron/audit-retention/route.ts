import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const RETENTION_DAYS = 5 * 365; // 5 ans, cf. Phase 3 §7 (configurable par organisation à terme)

/**
 * Route interne appelée par le cron Hostinger (ADR-007).
 * Idempotente : peut être appelée plusieurs fois sans double effet indésirable.
 * Protégée par un secret partagé, jamais par une simple vérification d'origine.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

  const result = await prisma.auditLog.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  console.info(JSON.stringify({
    job: "audit-retention",
    deletedCount: result.count,
    cutoff: cutoff.toISOString(),
    executedAt: new Date().toISOString(),
  }));

  return NextResponse.json({ deletedCount: result.count }, { status: 200 });
}
