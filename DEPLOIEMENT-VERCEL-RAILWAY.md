# Déploiement sur Vercel + Railway

C'est le chemin le plus court : pas de SSH, pas de serveur à gérer, pas de script de build
à lancer manuellement sur un serveur. Compte à rebours : ~20 minutes, tout gratuit pour démarrer.

Il y a 5 étapes. Les 3 premières sont des créations de compte/service (incompressibles,
personne ne peut les faire à ta place). Les 2 dernières sont un copier-coller de clés.

---

## Étape 1 — Mettre le code sur GitHub

Vercel se connecte à un dépôt GitHub pour déployer. Deux façons de faire :

### Option A — Sans terminal (le plus simple)
1. Va sur https://github.com et crée un compte (gratuit) si tu n'en as pas.
2. Clique sur **+** en haut à droite → **New repository**.
3. Nomme-le `ai-policy-desk`, laisse-le "Public" ou "Private" (peu importe), ne coche rien d'autre → **Create repository**.
4. Sur la page qui s'affiche, clique le lien **"uploading an existing file"**.
5. Ouvre le dossier `ai-policy-desk-mvp` sur ton ordinateur, sélectionne tout son contenu (Ctrl+A), et glisse-dépose dans la fenêtre GitHub.
6. Clique **Commit changes** en bas.

### Option B — Avec terminal (si tu es à l'aise)
```bash
cd ai-policy-desk-mvp
git init
git add .
git commit -m "MVP initial"
git branch -M main
git remote add origin https://github.com/<ton-compte>/ai-policy-desk.git
git push -u origin main
```

⚠️ Vérifie que tu n'envoies pas de fichier `.env` rempli avec de vraies clés (le `.env.example` fourni ne contient aucun secret, c'est celui-là qu'il faut envoyer).

---

## Étape 2 — Créer la base de données sur Railway

1. Va sur https://railway.app et crée un compte (tu peux te connecter directement avec GitHub, un clic).
2. Clique **New Project** → **Provision MySQL**.
3. Une fois créée, clique sur la base MySQL → onglet **Connect** (ou **Variables**).
4. Copie la valeur de **`MYSQL_PUBLIC_URL`** (ou `DATABASE_URL` selon l'affichage) — une ligne qui ressemble à :
   ```
   mysql://root:xxxxxxxx@monorail.proxy.rlwy.net:12345/railway
   ```
   Garde cette ligne de côté, tu en as besoin 2 fois (étapes 3 et 4).

---

## Étape 3 — Préparer les migrations (une seule fois, depuis ton ordinateur)

Il te faut Node.js installé sur ton ordinateur (télécharge-le sur nodejs.org si besoin, prends la version LTS).

Dans le dossier `ai-policy-desk-mvp` sur ton ordinateur :

```bash
chmod +x migrate.sh
DATABASE_URL="colle-ici-la-ligne-copiée-à-l'étape-2" ./migrate.sh
```

Ça crée toutes les tables dans ta base Railway. Tu ne referas ça que si le schéma change plus tard.

---

## Étape 4 — Déployer sur Vercel

1. Va sur https://vercel.com et crée un compte en te connectant avec GitHub (1 clic).
2. Clique **Add New...** → **Project**.
3. Sélectionne ton dépôt `ai-policy-desk` dans la liste → **Import**.
4. Vercel détecte automatiquement Next.js, ne change rien aux réglages de build.
5. Ouvre la section **Environment Variables** et ajoute (une par une, nom puis valeur) :

| Nom | Valeur |
|---|---|
| `DATABASE_URL` | la même ligne Railway copiée à l'étape 2 |
| `AUTH_SECRET` | génère avec `openssl rand -base64 32` dans un terminal, ou via https://generate-secret.vercel.app/32 |
| `ENCRYPTION_KEY` | même méthode, une **deuxième** valeur différente |
| `APP_URL` | laisse vide pour l'instant, tu la complèteras après le 1er déploiement |
| `EMAIL_PROVIDER` | `console` (pour démarrer sans configurer Brevo tout de suite) |
| `CRON_SECRET` | génère une 3e valeur avec la même méthode |

6. Clique **Deploy**. Vercel installe, compile et met en ligne — 2 à 3 minutes.

---

## Étape 5 — Finaliser

1. Une fois déployé, Vercel te donne une URL du type `https://ai-policy-desk-xxxx.vercel.app`.
2. Retourne dans **Settings → Environment Variables**, édite `APP_URL` avec cette URL, puis va dans l'onglet **Deployments** → clique **Redeploy** sur le dernier déploiement (pour que la variable soit prise en compte).
3. Ouvre l'URL dans ton navigateur → tu dois voir la page d'accueil "AI Policy Desk".

---

## Pour les mises à jour futures

Avec l'option A (upload web) : reviens sur ton dépôt GitHub, glisse les fichiers modifiés, Vercel redéploie automatiquement.
Avec l'option B (git) : `git add . && git commit -m "..." && git push` — Vercel redéploie automatiquement à chaque push.

## Fonctionnalités à activer plus tard (non bloquantes)
Ajoute ces variables d'environnement dans Vercel quand tu es prêt :
- `BREVO_API_KEY` + `EMAIL_PROVIDER=brevo` → pour l'envoi d'emails réels
- `R2_ENDPOINT`, `R2_BUCKET_NAME`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` → pour le stockage de documents
- `ANTHROPIC_API_KEY` → pour la génération de politiques par IA
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` → pour la facturation

Pour les tâches planifiées (purge d'audit, notifications), Vercel propose les **Vercel Cron Jobs**
nativement (fichier `vercel.json`) — dis-moi quand tu en es là et je te le configure.
