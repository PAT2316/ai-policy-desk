"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function InviteMemberForm({
  organizationId,
  roles,
}: {
  organizationId: string;
  roles: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState(roles[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const res = await fetch("/api/organizations/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, roleId, organizationId }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(
        data.error === "already_member"
          ? "Cette personne fait déjà partie de l'organisation."
          : "Une erreur est survenue."
      );
      return;
    }

    setSuccess(`Invitation envoyée à ${email}.`);
    setEmail("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 items-end flex-wrap">
      <div className="flex-1 min-w-[220px]">
        <label className="block text-xs text-gray-500 mb-1" htmlFor="invite-email">
          Email
        </label>
        <input
          id="invite-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="collegue@exemple.com"
          className="w-full border rounded-md px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1" htmlFor="invite-role">
          Rôle
        </label>
        <select
          id="invite-role"
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm"
        >
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-md disabled:opacity-50"
      >
        {loading ? "Envoi..." : "Inviter"}
      </button>
      {error && <p className="text-sm text-red-600 w-full">{error}</p>}
      {success && <p className="text-sm text-green-700 w-full">{success}</p>}
    </form>
  );
}
