import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-semibold mb-3">AI Policy Desk</h1>
        <p className="text-gray-600 mb-6">
          Inventoriez, évaluez et documentez l'usage de l'intelligence artificielle dans votre organisation.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/login" className="px-4 py-2 rounded-md border text-sm font-medium">
            Connexion
          </Link>
          <Link href="/register" className="px-4 py-2 rounded-md bg-gray-900 text-white text-sm font-medium">
            Créer un compte
          </Link>
        </div>
      </div>
    </main>
  );
}
