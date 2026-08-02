"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AssignTrainingForm({
  organizationId,
  courses,
  members,
}: {
  organizationId: string;
  courses: { id: string; title: string }[];
  members: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [trainingCourseId, setTrainingCourseId] = useState(courses[0]?.id ?? "");
  const [userId, setUserId] = useState(members[0]?.id ?? "");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const res = await fetch("/api/training-assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId,
        trainingCourseId,
        userId,
        dueDate: dueDate || undefined,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Une erreur est survenue.");
      return;
    }

    setSuccess("Formation assignée avec succès.");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-lg border p-6">
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="course">
          Formation
        </label>
        <select
          id="course"
          value={trainingCourseId}
          onChange={(e) => setTrainingCourseId(e.target.value)}
          className="w-full border rounded-md px-3 py-2 text-sm"
        >
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="member">
          Membre
        </label>
        <select
          id="member"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="w-full border rounded-md px-3 py-2 text-sm"
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="dueDate">
          Date limite (facultatif)
        </label>
        <input
          id="dueDate"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full border rounded-md px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-700">{success}</p>}

      <button
        type="submit"
        disabled={loading || courses.length === 0 || members.length === 0}
        className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-md disabled:opacity-50"
      >
        {loading ? "Envoi..." : "Assigner"}
      </button>
    </form>
  );
}
