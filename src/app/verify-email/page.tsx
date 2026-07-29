"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Lien de vérification invalide.");
      return;
    }

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage(data.message);
        } else {
          setStatus("error");
          setMessage(data.error === "invalid_or_expired_token" ? "Ce lien a expiré ou est invalide." : "Une erreur est survenue.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Impossible de contacter le serveur.");
      });
  }, [token]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-lg shadow p-8 text-center">
        {status === "loading" && <p className="text-sm text-gray-600">Vérification en cours...</p>}
        {status === "success" && (
          <>
            <h1 className="text-xl font-semibold mb-2 text-green-700">Email vérifié</h1>
            <p className="text-sm text-gray-600 mb-4">{message}</p>
            <Link href="/login" className="text-sm text-gray-900 underline">
              Se connecter
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <h1 className="text-xl font-semibold mb-2 text-red-700">Échec de la vérification</h1>
            <p className="text-sm text-gray-600 mb-4">{message}</p>
            <Link href="/register" className="text-sm text-gray-900 underline">
              Retour à l'inscription
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
