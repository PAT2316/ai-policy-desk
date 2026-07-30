"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ALLOWED_TRANSITIONS: Record<string, { status: string; label: string; style: string }[]> = {
  draft: [{ status: "pending_approval", label: "Soumettre pour approbation", style: "bg-gray-900 text-white" }],
  pending_approval: [
    { status: "approved", label: "Approuver", style: "bg-green-600 text-white" },
    { status: "rejected", label: "Rejeter", style: "bg-red-600 text-white" },
  ],
  approved: [{ status: "draft", label: "Repasser en brouillon", style: "border text-gray-700" }],
  rejected: [{ status: "draft", label: "Repasser en brouillon", style: "border text-gray-700" }],
};

export function UseCaseStatusActions({
  useCaseId,
  organizationId,
  currentStatus,
}: {
  useCaseId: string;
  organizationId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function transition(status: string) {
    setLoading(status);
    const res = await fetch(`/api/use-cases/${useCaseId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId, approvalStatus: status }),
    });
    setLoading(null);
    if (res.ok) router.refresh();
  }

  const actions = ALLOWED_TRANSITIONS[currentStatus] ?? [];
  if (actions.length === 0) return null;

  return (
    <div className="flex gap-2">
      {actions.map((a) => (
        <button
          key={a.status}
          onClick={() => transition(a.status)}
          disabled={loading !== null}
          className={`text-xs font-medium px-2 py-1 rounded disabled:opacity-50 ${a.style}`}
        >
          {loading === a.status ? "..." : a.label}
        </button>
      ))}
    </div>
  );
}
