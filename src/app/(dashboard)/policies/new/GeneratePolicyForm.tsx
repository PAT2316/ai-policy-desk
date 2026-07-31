"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const FIELD_DEFS: { key: string; label: string; placeholder: string; textarea?: boolean }[] = [
  { key: "sector", label: "Secteur d'activité", placeholder: "ex. Services numériques" },
  { key: "allowedTools", label: "Outils d'IA autorisés", placeholder: "ex. Claude, ChatGPT Entreprise", textarea: true },
  { key: "forbiddenTools", label: "Outils d'IA interdits", placeholder: "ex. Outils grand public non approuvés", textarea: true },
  { key: "forbiddenData", label: "Données interdites d'usage avec l'IA", placeholder: "ex. données clients, données de santé", textarea: true },
  { key: "validationRules", label: "Règles de validation des contenus générés", placeholder: "ex. relecture obligatoire avant publication", textarea: true },
  { key: "responsibilities", label: "Responsabilités des employés", placeholder: "ex. vérifier l'exactitude des résultats", textarea: true },
  { key: "humanControlRequirements", label: "Exigences de contrôle humain", placeholder: "ex. validation manager avant envoi client", textarea: true },
  { key: "confidentialityRules", label: "Règles de confidentialité", placeholder: "ex. ne jamais saisir d'informations confidentielles", textarea: true },
  { key: "ipRules", label: "Règles de propriété intellectuelle", placeholder: "ex. citer l'usage d'IA dans les livrables", textarea: true },
  { key: "reportingProcedure", label: "Procédure de signalement d'incident", placeholder: "ex. contacter le responsable IA", textarea: true },
  { key: "disciplinaryMeasures", label: "Mesures en cas de non-respect", placeholder: "ex. avertissement, formation complémentaire", textarea: true },
  { key: "reviewFrequency", label: "Fréquence de révision de la politique", placeholder: "ex. tous les 6 mois" },
];

export function GeneratePolicyForm({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [language, setLanguage] = useState("fr");
  const [country, setCountry] = useState("CM");
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function setField(key: string, v: string) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/policies/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId,
        language,
        country,
        ...Object.fromEntries(FIELD_DEFS.map((f) => [f.key, values[f.key] ?? ""])),
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(
        data.error === "ai_provider_not_configured"
          ? "La génération par IA n'est pas encore configurée sur ce déploiement (clé API manquante)."
          : "Une erreur est survenue. Vérifie que tous les champs sont renseignés."
      );
      return;
    }

    const data = await res.json();
    router.push(`/policies/${data.policy.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-lg border p-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="language">
            Langue du document
          </label>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
          >
            <option value="fr">Français</option>
            <option value="en">Anglais</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="country">
            Pays (code à 2 lettres)
          </label>
          <input
            id="country"
            required
            maxLength={2}
            value={country}
            onChange={(e) => setCountry(e.target.value.toUpperCase())}
            className="w-full border rounded-md px-3 py-2 text-sm uppercase"
          />
        </div>
      </div>

      {FIELD_DEFS.map((f) => (
        <div key={f.key}>
          <label className="block text-sm font-medium mb-1" htmlFor={f.key}>
            {f.label}
          </label>
          {f.textarea ? (
            <textarea
              id={f.key}
              required
              value={values[f.key] ?? ""}
              onChange={(e) => setField(f.key, e.target.value)}
              placeholder={f.placeholder}
              rows={2}
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          ) : (
            <input
              id={f.key}
              required
              value={values[f.key] ?? ""}
              onChange={(e) => setField(f.key, e.target.value)}
              placeholder={f.placeholder}
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          )}
        </div>
      ))}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-md disabled:opacity-50"
      >
        {loading ? "Génération en cours..." : "Générer le brouillon"}
      </button>
    </form>
  );
}
