"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ALLOWED_TRANSITIONS: Record<string, { status: string; label: string; style: string }[]> = {
  open: [
    { status: "investigating", label: "Démarrer l'investigation", style: "bg-gray-900 text-white" },
    { status: "closed", label: "Clôturer", style: "border text-gray-700" },
  ],
  investigating: [
    { status: "resolved", label: "Marquer résolu", style: "bg-green-600 text-white" },
    { status: "open", label: "Repasser en ouvert", style: "border text-gray-700" },
  ],
  resolved: [
    { status: "closed", label: "Clôturer", style: "bg-gray-900 text-white" },
    { status: "investigating", label: "Rouvrir l'investigation", style: "border text-gray-700" },
  ],
  closed: [],
};

export function IncidentStatusActions({
  incidentId,
  organizationId,
  currentStatus,
}: {
  incidentId: string;
  organizationId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function transition(status: string) {
    setLoading(status);
    const res = await fetch(`/api/incidents/${incidentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId, status }),
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
