import { prisma } from "./prisma";
import { getOrgContext, OrgContext, OrgContextError } from "./orgContext";
import type { PermissionCode } from "./permissions";

export { OrgContextError };

/**
 * Point de passage OBLIGATOIRE pour toute route protégée par permission, à partir de M4.
 * Ne jamais dupliquer cette logique dans une route — toujours appeler cette fonction.
 *
 * Usage :
 *   const ctx = await requirePermission(req, PERMISSIONS.AI_TOOL_CREATE);
 *   // ctx.organizationId est garanti appartenir réellement à ctx.userId
 */
export async function requirePermission(
  permission: PermissionCode,
  requestedOrganizationId?: string
): Promise<OrgContext> {
  const ctx = await getOrgContext(requestedOrganizationId);

  const hasPermission = await prisma.rolePermission.findFirst({
    where: {
      roleId: ctx.roleId,
      permission: { code: permission },
    },
  });

  if (!hasPermission) {
    throw new OrgContextError(403, `missing_permission:${permission}`);
  }

  return ctx;
}

/**
 * Vérifie qu'une ressource identifiée par son id appartient bien à l'organisation du contexte,
 * avant toute lecture/écriture. À appeler systématiquement pour les ressources référencées
 * indirectement (ex. un aiToolId envoyé dans le corps d'une requête UseCase).
 */
export async function assertResourceBelongsToOrg(
  model: { findUnique: (args: { where: { id: string } } ) => Promise<{ organizationId: string } | null> },
  resourceId: string,
  organizationId: string
): Promise<void> {
  const resource = await model.findUnique({ where: { id: resourceId } });
  if (!resource || resource.organizationId !== organizationId) {
    throw new OrgContextError(403, "cross_organization_access_denied");
  }
}
