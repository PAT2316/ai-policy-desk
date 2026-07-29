import { prisma } from "./prisma";
import { getServerSession } from "./session";

export class OrgContextError extends Error {
  constructor(public status: 401 | 403, message: string) {
    super(message);
  }
}

export interface OrgContext {
  userId: string;
  organizationId: string;
  roleId: string;
  roleName: string;
}

/**
 * Dérive le contexte organisation UNIQUEMENT depuis la session serveur + la table Membership.
 *
 * `requestedOrganizationId` (optionnel) est le seul cas où une valeur vient du client — par exemple
 * un utilisateur multi-organisations changeant d'organisation active via un sélecteur. Dans ce cas,
 * la valeur n'est JAMAIS utilisée directement : on vérifie qu'un Membership actif existe réellement
 * entre l'utilisateur courant et cette organisation avant de l'accepter.
 */
export async function getOrgContext(requestedOrganizationId?: string): Promise<OrgContext> {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new OrgContextError(401, "unauthorized");
  }

  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      status: "active",
      ...(requestedOrganizationId ? { organizationId: requestedOrganizationId } : {}),
    },
    include: { role: true },
    orderBy: { joinedAt: "asc" }, // à défaut de sélection explicite, l'organisation la plus ancienne
  });

  if (!membership) {
    throw new OrgContextError(403, "no_active_membership");
  }

  return {
    userId: session.user.id,
    organizationId: membership.organizationId,
    roleId: membership.roleId,
    roleName: membership.role.name,
  };
}
