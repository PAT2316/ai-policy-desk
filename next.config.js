/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pas de "output: standalone" ici : Vercel gère lui-même l'empaquetage des fonctions serverless,
  // cette option est réservée aux déploiements sur un serveur Node.js classique.
};

module.exports = nextConfig;
