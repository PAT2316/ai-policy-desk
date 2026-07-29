# AI Policy Desk — MVP consolidé

Projet assemblé à partir des modules M1 à M16 (Phase 6). Structure Next.js App Router + Prisma/MySQL,
prêt pour installation locale puis déploiement sur Hostinger.

## Démarrage local

```bash
npm install
cp .env.example .env        # puis remplir les valeurs réelles
npx prisma migrate dev --name init
npm run seed
npm run dev
```

## Tests

```bash
npm run test
```

## Structure

```
src/
  app/
    api/            → toutes les routes API (une sous-route par module M1-M16)
    layout.tsx, page.tsx  → coquille minimale (Phase 4 UX à assembler ici)
  lib/
    auth.ts, session.ts, password.ts, tokens.ts, rateLimiter.ts, crypto.ts   (M1)
    permissions.ts, orgContext.ts, authorize.ts                              (M2)
    audit.ts                                                                 (M3)
    aiToolSchema.ts                                                          (M4)
    useCaseSchema.ts                                                         (M5)
    riskScoring.ts                                                           (M6)
    ai/                                                                      (M7)
    storage/                                                                 (M8)
    quizScoring.ts                                                           (M9)
    incidentSchema.ts                                                        (M10)
    correctiveActionSchema.ts                                                (M11)
    dashboardAggregations.ts                                                 (M12)
    email/, notificationRules.ts                                             (M13)
    payment/                                                                 (M15)
  middleware.ts     → protection des routes (M1)
prisma/
  schema.prisma     → schéma complet (fusion Phase 3 + tokens d'authentification)
  seed.ts
tests/
  m1-auth/ ... m16-admin/   → tests par module
```

## Ce qui reste à faire avant une mise en production réelle

1. **Phase 4 UX** : construire les écrans React dans `src/app/(dashboard)/...` à partir des wireframes
   textuels déjà livrés (navigation, tableau de bord, formulaires multi-étapes, etc.).
2. **PDF/DOCX réels** : `PolicyVersion.exportPdfUrl`/`exportDocxUrl` sont des champs prêts, mais la
   génération effective (ex. bibliothèque `docx`, `pdf-lib` ou service dédié) reste à implémenter.
3. **Antivirus sur les uploads** (`Attachment.scanStatus`) : prévu au schéma, hors périmètre MVP.
4. **Deux fournisseurs manquants dans `RolePermission`** : le seed ne crée que le catalogue de
   permissions ; la création des rôles système + attribution se fait automatiquement à la création
   de chaque organisation (voir `POST /api/organizations`).
5. Configurer réellement les comptes Cloudflare R2, Brevo, Stripe et Anthropic dans `.env`.

Voir `DEPLOIEMENT-VERCEL-RAILWAY.md` pour la mise en ligne (Vercel + Railway, sans serveur à gérer).
