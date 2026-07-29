import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { requirePermission, OrgContextError } from "@/lib/authorize";
import { PERMISSIONS } from "@/lib/permissions";
import { validateFile } from "@/lib/storage/fileValidation";
import { R2StorageProvider } from "@/lib/storage/R2StorageProvider";
import { logAudit } from "@/lib/audit";

const requestSchema = z.object({
  organizationId: z.string().min(1),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  sizeBytes: z.number().positive(),
  documentName: z.string().min(1).max(200),
  folderPath: z.string().default("/"),
});

const storage = new R2StorageProvider();

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const validation = validateFile(parsed.data);
  if (!validation.valid) {
    return NextResponse.json({ error: "invalid_file", message: validation.reason }, { status: 400 });
  }

  try {
    const ctx = await requirePermission(PERMISSIONS.DOCUMENT_UPLOAD, parsed.data.organizationId);

    // Clé préfixée par organizationId : même en cas d'erreur applicative, aucune collision inter-organisation possible.
    const key = `${ctx.organizationId}/${randomUUID()}-${parsed.data.fileName}`;

    const { uploadUrl } = await storage.getSignedUploadUrl({
      key,
      mimeType: parsed.data.mimeType,
      maxSizeBytes: parsed.data.sizeBytes,
    });

    const document = await prisma.document.create({
      data: { organizationId: ctx.organizationId, name: parsed.data.documentName, folderPath: parsed.data.folderPath },
    });

    const version = await prisma.documentVersion.create({
      data: {
        documentId: document.id,
        versionNumber: 1,
        storageKey: key,
        mimeType: parsed.data.mimeType,
        size: parsed.data.sizeBytes,
        checksum: "pending", // à recalculer côté serveur après confirmation d'upload (hors MVP : job de vérification)
        uploadedByUserId: ctx.userId,
      },
    });

    await prisma.document.update({ where: { id: document.id }, data: { currentVersionId: version.id } });

    await logAudit({
      organizationId: ctx.organizationId, userId: ctx.userId,
      action: "create", resourceType: "Document", resourceId: document.id, newState: { document, version },
    }, req);

    return NextResponse.json({ uploadUrl, document, version }, { status: 201 });
  } catch (err) {
    if (err instanceof OrgContextError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
