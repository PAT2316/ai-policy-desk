#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────────────────
# À lancer UNE SEULE FOIS, depuis ton ordinateur (pas sur Vercel), après
# avoir créé la base MySQL sur Railway.
#
# Usage :
#   chmod +x migrate.sh
#   DATABASE_URL="mysql://...ta-connection-string-railway..." ./migrate.sh
#
# Ce script prépare les tables dans la base de données. Il faut le relancer
# uniquement si tu modifies plus tard le schéma (prisma/schema.prisma).
# ────────────────────────────────────────────────────────────────────────
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL n'est pas défini."
  echo "   Relance avec : DATABASE_URL=\"mysql://...\" ./migrate.sh"
  exit 1
fi

echo "[1/4] Installation des dépendances..."
npm install

echo "[2/4] Génération du client Prisma..."
npx prisma generate

echo "[3/4] Application des migrations sur la base Railway..."
npx prisma migrate deploy

echo "[4/4] Initialisation des permissions de base..."
npm run seed

echo ""
echo "✅ Base de données prête. Tu peux maintenant déployer sur Vercel."
