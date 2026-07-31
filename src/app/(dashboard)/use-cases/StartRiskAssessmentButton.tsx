"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function StartRiskAssessmentButton({
  useCaseId,
  organizationId,
}: {
  useCaseId: string;
  organizationId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function start() {
    setLoading(true);
    const res = await fetch("/api/risk-assessments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId, useCaseId }),
    });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      router.push(`/risk-assessments/${data.assessment.id}`);
    }
  }

  return (
    <button
      onClick={start}
      disabled={loading}
      className="text-xs font-medium px-2 py-1 rounded border text-gray-700 disabled:opacity-50"
    >
      {loading ? "..." : "Évaluer le risque"}
    </button>
  );
}
