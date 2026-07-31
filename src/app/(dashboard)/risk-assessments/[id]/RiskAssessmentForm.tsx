"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Question {
  id: string;
  category: string;
  text: string;
}

interface ScoreBreakdownItem {
  category: string;
  contribution: number;
}

const LEVEL_LABEL: Record<string, string> = {
  low: "Faible",
  moderate: "Modéré",
  high: "Élevé",
  critical: "Critique",
};

const ANSWER_LABELS = ["0 — Aucun risque", "1 — Faible", "2 — Modéré", "3 — Élevé", "4 — Maximal"];

export function RiskAssessmentForm({
  assessmentId,
  organizationId,
  questions,
  existingAnswers,
  existingScore,
  status,
}: {
  assessmentId: string;
  organizationId: string;
  questions: Question[];
  existingAnswers: Record<string, number>;
  existingScore: { level: string; rawScore: number } | null;
  status: string;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, number>>(existingAnswers);
  const [score, setScore] = useState(existingScore);
  const [breakdown, setBreakdown] = useState<ScoreBreakdownItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [confirmedLevel, setConfirmedLevel] = useState(existingScore?.level ?? "low");
  const [justification, setJustification] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(status === "confirmed");

  const allAnswered = questions.every((q) => answers[q.id] !== undefined);

  async function handleComputeScore(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch(`/api/risk-assessments/${assessmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId,
        answers: questions.map((q) => ({ riskQuestionId: q.id, value: answers[q.id] })),
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      setError("Impossible de calculer le score. Vérifie que toutes les questions sont répondues.");
      return;
    }

    const data = await res.json();
    setScore(data.score);
    setBreakdown(data.breakdown);
    setConfirmedLevel(data.score.level);
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setConfirming(true);

    const res = await fetch(`/api/risk-assessments/${assessmentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId, confirmedLevel, justification: justification || undefined }),
    });

    setConfirming(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? "Impossible de confirmer le niveau de risque.");
      return;
    }

    setConfirmed(true);
    router.refresh();
  }

  if (confirmed) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <p className="text-sm text-gray-500 mb-1">Niveau de risque confirmé</p>
        <p className="text-2xl font-semibold">{LEVEL_LABEL[confirmedLevel] ?? confirmedLevel}</p>
        <p className="text-sm text-gray-500 mt-4">
          Cette évaluation est finalisée. Pour la refaire, crée une nouvelle évaluation depuis la page
          « Cas d'usage ».
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleComputeScore} className="bg-white rounded-lg border p-6 space-y-5">
        {questions.map((q) => (
          <div key={q.id}>
            <label className="block text-sm font-medium mb-2">{q.text}</label>
            <div className="flex gap-2 flex-wrap">
              {ANSWER_LABELS.map((label, value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: value }))}
                  className={`text-xs px-3 py-1.5 rounded border ${
                    answers[q.id] === value
                      ? "bg-gray-900 text-white border-gray-900"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={!allAnswered || submitting}
          className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-md disabled:opacity-50"
        >
          {submitting ? "Calcul..." : "Calculer le score"}
        </button>
      </form>

      {score && (
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-500 mb-1">Score calculé</p>
          <p className="text-2xl font-semibold mb-4">
            {LEVEL_LABEL[score.level] ?? score.level} — {score.rawScore}/100
          </p>

          {breakdown.length > 0 && (
            <div className="mb-5">
              <p className="text-xs text-gray-500 mb-2">Détail par catégorie</p>
              <ul className="space-y-1">
                {breakdown.map((b) => (
                  <li key={b.category} className="text-sm text-gray-600 flex justify-between">
                    <span>{b.category}</span>
                    <span>{b.contribution} pts</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleConfirm} className="border-t pt-5 space-y-3">
            <p className="text-sm font-medium">Confirmation humaine (obligatoire)</p>
            <div>
              <label className="block text-xs text-gray-500 mb-1" htmlFor="confirmedLevel">
                Niveau de risque retenu
              </label>
              <select
                id="confirmedLevel"
                value={confirmedLevel}
                onChange={(e) => setConfirmedLevel(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              >
                <option value="low">Faible</option>
                <option value="moderate">Modéré</option>
                <option value="high">Élevé</option>
                <option value="critical">Critique</option>
              </select>
            </div>

            {confirmedLevel !== score.level && (
              <div>
                <label className="block text-xs text-gray-500 mb-1" htmlFor="justification">
                  Justification (obligatoire si tu modifies le niveau calculé, 10 caractères min.)
                </label>
                <textarea
                  id="justification"
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  rows={3}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={confirming}
              className="bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-md disabled:opacity-50"
            >
              {confirming ? "Confirmation..." : "Confirmer ce niveau de risque"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
