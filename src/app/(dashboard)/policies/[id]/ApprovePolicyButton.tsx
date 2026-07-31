"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ApprovePolicyButton({
  policyId,
  versionId,
  organizationId,
}: {
  policyId: string;
  versionId: string;
  organizationId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function approve() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/policies/${policyId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId, versionId }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Impossible d'approuver cette version (permission manquante ?).");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <button
        onClick={approve}
        disabled={loading}
        className="bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-md disabled:opacity-50"
      >
        {loading ? "Approbation..." : "Approuver cette version"}
      </button>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
