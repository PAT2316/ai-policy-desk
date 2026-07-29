"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [country, setCountry] = useState("CM");
  const [size, setSize] = useState("1-10");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, country, size, primaryLanguage: "fr", timezone: "Africa/Douala" }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error === "invalid_input" ? "Vérifie les champs renseignés." : "Une erreur est survenue.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-8">
        <h1 className="text-xl font-semibold mb-1">Créer ton organisation</h1>
        <p className="text-sm text-gray-500 mb-6">
          Une dernière étape avant d'accéder au tableau de bord.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="name">
              Nom de l'organisation
            </label>
            <input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex. HakimTech 23"
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
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

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="size">
              Taille de l'organisation
            </label>
            <select
              id="size"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm"
            >
              <option value="1-10">1 à 10 personnes</option>
              <option value="11-50">11 à 50 personnes</option>
              <option value="51-200">51 à 200 personnes</option>
              <option value="201-1000">201 à 1000 personnes</option>
              <option value="1000+">Plus de 1000 personnes</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white rounded-md py-2 text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Création..." : "Créer et continuer"}
          </button>
        </form>
      </div>
    </main>
  );
}
