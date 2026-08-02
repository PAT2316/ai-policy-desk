"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Question {
  id: string;
  text: string;
  options: string[];
}

export function QuizForm({
  assignmentId,
  organizationId,
  quizId,
  passingScore,
  questions,
}: {
  assignmentId: string;
  organizationId: string;
  quizId: string;
  passingScore: number;
  questions: Question[];
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);

  const allAnswered = questions.every((q) => answers[q.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch(`/api/training-assignments/${assignmentId}/quiz-attempts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId,
        quizId,
        answers: questions.map((q) => ({ questionId: q.id, submittedAnswer: answers[q.id] })),
      }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Une erreur est survenue lors de la soumission du quiz.");
      return;
    }

    const data = await res.json();
    setResult(data.result);
    router.refresh();
  }

  if (result) {
    return (
      <div
        className={`rounded-lg border p-6 text-center ${
          result.passed ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
        }`}
      >
        <p className={`font-medium ${result.passed ? "text-green-800" : "text-red-800"}`}>
          {result.passed ? "Quiz réussi ✓" : "Quiz non réussi"}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          Score : {result.score}% (seuil de réussite : {passingScore}%)
        </p>
        {!result.passed && (
          <button
            onClick={() => setResult(null)}
            className="mt-3 text-sm underline text-gray-700"
          >
            Réessayer
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 space-y-5">
      <p className="text-sm font-medium">Quiz de validation</p>
      {questions.map((q, i) => (
        <div key={q.id}>
          <p className="text-sm font-medium mb-2">
            {i + 1}. {q.text}
          </p>
          <div className="space-y-2">
            {q.options.map((opt) => (
              <label key={opt} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={q.id}
                  value={opt}
                  checked={answers[q.id] === opt}
                  onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                />
                {opt}
              </label>
            ))}
          </div>
        </div>
      ))}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={!allAnswered || loading}
        className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-md disabled:opacity-50"
      >
        {loading ? "Envoi..." : "Valider mes réponses"}
      </button>
    </form>
  );
}
