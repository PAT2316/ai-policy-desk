"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewIncidentForm({
  organizationId,
  aiTools,
  useCases,
}: {
  organizationId: string;
  aiTools: { id: string; name: string }[];
  useCases: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [severity, setSeverity] = useState("moderate");
  const [aiToolId, setAiToolId] = useState("");
  const [useCaseId, setUseCaseId] = useState("");
  const [dataConcerned, setDataConcerned] = useState("");
  const [impact, setImpact] = useState("");
  const [immediateActions, setImmediateActions] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/incidents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId,
        title,
        description,
        date,
        severity,
        aiToolId: aiToolId || undefined,
        useCaseId: useCaseId || undefined,
        dataConcerned: dataConcerned || undefined,
        impact: impact || undefined,
        immediateActions: immediateActions || undefined,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Une erreur est survenue. Vérifie les champs renseignés.");
      return;
    }

    router.push("/incidents");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-lg border p-6">
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="title">
          Titre
        </label>
        <input
          id="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border rounded-md px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="description">
          Description de l'incident
        </label>
        <textarea
          id="description"
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full border rounded-md px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="date">
            Date de l'incident
          </label>
          <input
            id="date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="severity">
            Sévérité
          </label>
          <select
            id="severity"
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
          >
            <option value="low">Faible</option>
            <option value="moderate">Modérée</option>
            <option value="high">Élevée</option>
            <option value="critical">Critique</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="aiToolId">
            Outil d'IA concerné
          </label>
          <select
            id="aiToolId"
            value={aiToolId}
            onChange={(e) => setAiToolId(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
          >
            <option value="">— Non spécifié —</option>
            {aiTools.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="useCaseId">
            Cas d'usage concerné
          </label>
          <select
            id="useCaseId"
            value={useCaseId}
            onChange={(e) => setUseCaseId(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
          >
            <option value="">— Non spécifié —</option>
            {useCases.map((u) => (
              <option key={u.id} value={u.id}>
                {u.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="dataConcerned">
          Données concernées
        </label>
        <input
          id="dataConcerned"
          value={dataConcerned}
          onChange={(e) => setDataConcerned(e.target.value)}
          placeholder="ex. emails clients"
          className="w-full border rounded-md px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="impact">
          Impact constaté
        </label>
        <textarea
          id="impact"
          value={impact}
          onChange={(e) => setImpact(e.target.value)}
          rows={2}
          className="w-full border rounded-md px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="immediateActions">
          Actions immédiates déjà prises
        </label>
        <textarea
          id="immediateActions"
          value={immediateActions}
          onChange={(e) => setImmediateActions(e.target.value)}
          rows={2}
          className="w-full border rounded-md px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-md disabled:opacity-50"
      >
        {loading ? "Enregistrement..." : "Déclarer l'incident"}
      </button>
    </form>
  );
}
