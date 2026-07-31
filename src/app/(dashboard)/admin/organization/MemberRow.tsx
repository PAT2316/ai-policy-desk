"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_LABEL: Record<string, string> = {
  invited: "Invité",
  active: "Actif",
  suspended: "Révoqué",
};

export function MemberRow({
  membershipId,
  organizationId,
  userName,
  userEmail,
  status,
  currentRoleId,
  roles,
}: {
  membershipId: string;
  organizationId: string;
  userName: string;
  userEmail: string;
  status: string;
  currentRoleId: string;
  roles: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [roleId, setRoleId] = useState(currentRoleId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function changeRole(newRoleId: string) {
    setRoleId(newRoleId);
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/organizations/members/${membershipId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId, roleId: newRoleId }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error === "cannot_remove_last_owner" ? "Impossible : dernier propriétaire." : "Erreur.");
      setRoleId(currentRoleId);
      return;
    }
    router.refresh();
  }

  async function revoke() {
    if (!confirm(`Révoquer l'accès de ${userEmail} ?`)) return;
    setLoading(true);
    setError(null);
    const res = await fetch(
      `/api/organizations/members/${membershipId}?organizationId=${organizationId}`,
      { method: "DELETE" }
    );
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error === "cannot_remove_last_owner" ? "Impossible : dernier propriétaire." : "Erreur.");
      return;
    }
    router.refresh();
  }

  return (
    <tr className="border-b last:border-0">
      <td className="px-4 py-3">
        <p className="font-medium text-gray-900">{userName}</p>
        <p className="text-xs text-gray-500">{userEmail}</p>
      </td>
      <td className="px-4 py-3 text-gray-600">{STATUS_LABEL[status] ?? status}</td>
      <td className="px-4 py-3">
        <select
          value={roleId}
          onChange={(e) => changeRole(e.target.value)}
          disabled={loading || status === "suspended"}
          className="border rounded-md px-2 py-1 text-sm disabled:opacity-50"
        >
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </td>
      <td className="px-4 py-3 text-right">
        {status !== "suspended" && (
          <button
            onClick={revoke}
            disabled={loading}
            className="text-xs text-red-600 underline disabled:opacity-50"
          >
            Révoquer
          </button>
        )}
      </td>
    </tr>
  );
}
