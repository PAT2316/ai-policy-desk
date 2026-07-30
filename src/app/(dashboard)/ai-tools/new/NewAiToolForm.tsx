"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewAiToolForm({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");
  const [criticality, setCriticality] = useState("low");
  const [personalDataInvolved, setPersonalDataInvolved] = useState(false);
  const [dataTypesProcessed, setDataTypesProcessed] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/ai-tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId,
        name,
        category: category || undefined,
        description: description || undefined,
        status,
        criticality,
        personalDataInvolved,
        dataTypesProcessed: dataTypesProcessed || undefined,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Une erreur est survenue. Vérifie les champs renseignés.");
      return;
    }

    router.push("/ai-tools");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-lg border p-6">
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="name">
          Nom de l'outil
        </label>
        <input
          id="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ex. ChatGPT, Claude, Copilot..."
          className="w-full border rounded-md px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="category">
          Catégorie
        </label>
        <input
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="ex. Assistant conversationnel, génération de texte..."
          className="w-full border rounded-md px-3 py-2 text-sm"
        />
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="status">
            Statut
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
          >
            <option value="active">Actif</option>
            <option value="under_review">En révision</option>
            <option value="deprecated">Retiré</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="criticality">
            Criticité
          </label>
          <select
            id="criticality"
            value={criticality}
            onChange={(e) => setCriticality(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
          >
            <option value="low">Faible</option>
            <option value="moderate">Modérée</option>
            <option value="high">Élevée</option>
            <option value="critical">Critique</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="dataTypesProcessed">
          Types de données traitées
        </label>
        <input
          id="dataTypesProcessed"
          value={dataTypesProcessed}
          onChange={(e) => setDataTypesProcessed(e.target.value)}
          placeholder="ex. emails clients, données RH..."
          className="w-full border rounded-md px-3 py-2 text-sm"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={personalDataInvolved}
          onChange={(e) => setPersonalDataInvolved(e.target.checked)}
        />
        Cet outil traite des données personnelles
      </label>

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
