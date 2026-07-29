"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, locale: "fr" }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Une erreur est survenue.");
        setLoading(false);
        return;
      }

      setDone(true);
      if (data.devVerificationUrl) setDevLink(data.devVerificationUrl);
    } catch {
      setError("Impossible de contacter le serveur. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm bg-white rounded-lg shadow p-8 text-center">
          <h1 className="text-xl font-semibold mb-3">Vérifiez votre email</h1>
          <p className="text-sm text-gray-600 mb-4">
            Si cet email n'est pas déjà utilisé, un lien de vérification vient d'être envoyé.
          </p>
          {devLink && (
            <div className="text-left bg-amber-50 border border-amber-200 rounded-md p-3 mb-4">
              <p className="text-xs text-amber-800 mb-2">
                Mode développement (aucun fournisseur d'email configuré) — clique ce lien pour vérifier
                ton compte directement :
              </p>
              <a href={devLink} className="text-xs underline break-all text-amber-900">
                {devLink}
              </a>
            </div>
          )}
          <Link href="/login" className="text-sm text-gray-900 underline">
            Retour à la connexion
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-lg shadow p-8">
        <h1 className="text-xl font-semibold mb-1">Créer un compte</h1>
        <p className="text-sm text-gray-500 mb-6">AI Policy Desk</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="name">
              Nom complet
            </label>
            <input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="password">
              Mot de passe (10 caractères minimum)
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={10}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white rounded-md py-2 text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Création..." : "Créer mon compte"}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-6 text-center">
          Déjà un compte ?{" "}
          <Link href="/login" className="text-gray-900 underline">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  );
}
