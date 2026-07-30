"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewUseCaseForm({
  organizationId,
  aiTools,
}: {
  organizationId: string;
  aiTools: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [aiToolId, setAiToolId] = useState("");
  const [businessGoal, setBusinessGoal] = useState("");
  const [automationLevel, setAutomationLevel] = useState("human_in_loop");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/use-cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId,
        title,
        description: description || undefined,
        aiToolId: aiToolId || undefined,
        businessGoal: businessGoal || undefined,
        automationLevel,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Une erreur est survenue. Vérifie les champs renseignés.");
      return;
    }

    router.push("/use-cases");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-lg border p-6">
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="title">
          Titre du cas d'usage
        </label>
        <input
          id="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="ex. Rédaction automatique des offres d'emploi"
          className="w-full border rounded-md px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="aiToolId">
          Outil d'IA utilisé
        </label>
        <select
          id="aiToolId"
          value={aiToolId}
          onChange={(e) => setAiToolId(e.target.value)}
          className="w-full border rounded-md px-3 py-2 text-sm"
        >
          <option value="">— Aucun / non spécifié —</option>
          {aiTools.map((tool) => (
            <option key={tool.id} value={tool.id}>
              {tool.name}
            </option>
          ))}
        </select>
        {aiTools.length === 0 && (
          <p className="text-xs text-gray-500 mt-1">
            Aucun outil d'IA enregistré pour l'instant — tu peux quand même créer ce cas d'usage.
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full border rounded-md px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="businessGoal">
          Objectif métier
        </label>
        <input
          id="businessGoal"
          value={businessGoal}
          onChange={(e) => setBusinessGoal(e.target.value)}
          placeholder="ex. Gagner du temps sur la rédaction"
          className="w-full border rounded-md px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="automationLevel">
          Niveau d'automatisation
        </label>
        <select
          id="automationLevel"
          value={automationLevel}
          onChange={(e) => setAutomationLevel(e.target.value)}
          className="w-full border rounded-md px-3 py-2 text-sm"
        >
          <option value="human_in_loop">Supervisé par un humain</option>
          <option value="semi_automated">Semi-automatisé</option>
          <option value="fully_automated">Entièrement automatisé</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-md disabled:opacity-50"
        >
          {loading ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
