import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, assertResourceBelongsToOrg, OrgContextError } from "@/lib/authorize";
import { PERMISSIONS } from "@/lib/permissions";
import { R2StorageProvider } from "@/lib/storage/R2StorageProvider";
import { logAudit } from "@/lib/audit";

interface RouteParams { params: { id: string } }
const storage = new R2StorageProvider();

export async function GET(req: NextRequest, { params }: RouteParams) {
  const orgId = req.nextUrl.searchParams.get("organizationId") ?? undefined;

  try {
    const ctx = await requirePermission(PERMISSIONS.DOCUMENT_DOWNLOAD, orgId);
    await assertResourceBelongsToOrg(prisma.document, params.id, ctx.organizationId);

    const document = await prisma.document.findUniqueOrThrow({ where: { id: params.id } });
    if (!document.currentVersionId) {
      return NextResponse.json({ error: "no_version_available" }, { status: 404 });
    }

    const version = await prisma.documentVersion.findUniqueOrThrow({ where: { id: document.currentVersionId } });
    const downloadUrl = await storage.getSignedDownloadUrl(version.storageKey);

    // Chaque génération d'URL de téléchargement est journalisée (Phase 2 §8 sécurité).
    await logAudit({
      organizationId: ctx.organizationId, userId: ctx.userId,
      action: "download", resourceType: "Document", resourceId: document.id,
    }, req);

    return NextResponse.json({ downloadUrl }, { status: 200 });
  } catch (err) {
    if (err instanceof OrgContextError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
