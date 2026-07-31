import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authorize";
import { PERMISSIONS } from "@/lib/permissions";
import { InviteMemberForm } from "./InviteMemberForm";
import { MemberRow } from "./MemberRow";

export default async function OrganizationAdminPage() {
  const ctx = await requirePermission(PERMISSIONS.MEMBER_INVITE);

  const [members, roles] = await Promise.all([
    prisma.membership.findMany({
      where: { organizationId: ctx.organizationId },
      include: { user: { select: { id: true, email: true, name: true } }, role: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.role.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold mb-6">Administration — Membres</h1>

      <div className="bg-white rounded-lg border p-6 mb-8">
        <p className="text-sm font-medium mb-3">Inviter un nouveau membre</p>
        <InviteMemberForm organizationId={ctx.organizationId} roles={roles} />
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b text-left text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">Membre</th>
              <th className="px-4 py-2 font-medium">Statut</th>
              <th className="px-4 py-2 font-medium">Rôle</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <MemberRow
                key={m.id}
                membershipId={m.id}
                organizationId={ctx.organizationId}
                userName={m.user.name}
                userEmail={m.user.email}
                status={m.status}
                currentRoleId={m.role.id}
                roles={roles}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
