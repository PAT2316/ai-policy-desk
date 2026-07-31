/**
 * Seed minimal : catalogue de permissions (utilisé par DEFAULT_ROLE_PERMISSIONS lors de la
 * création d'une organisation, cf. src/app/api/organizations/route.ts). Exécuter une seule fois
 * après la première migration.
 */
import { PrismaClient } from "@prisma/client";
import { PERMISSIONS } from "../src/lib/permissions";

const prisma = new PrismaClient();

// Questionnaire de risque global (organizationId: null → partagé par toutes les organisations).
// Échelle de réponse 0 (risque minimal) à 4 (risque maximal) pour chaque question,
// cf. src/lib/riskScoring.ts pour le calcul du score pondéré.
const RISK_QUESTIONS: { category: string; text: string; weight: number; orderIndex: number }[] = [
  {
    category: "sensibilite_donnees",
    text: "Quel est le niveau de sensibilité des données traitées par l'outil (0 = données publiques, 4 = données sensibles/santé/financières) ?",
    weight: 5,
    orderIndex: 1,
  },
  {
    category: "controle_humain",
    text: "Dans quelle mesure une décision peut-elle être prise sans validation humaine (0 = toujours validée, 4 = entièrement automatique) ?",
    weight: 5,
    orderIndex: 2,
  },
  {
    category: "population_affectee",
    text: "Quelle est l'ampleur de la population affectée par ce cas d'usage (0 = usage interne limité, 4 = grand public) ?",
    weight: 4,
    orderIndex: 3,
  },
  {
    category: "reversibilite",
    text: "Dans quelle mesure une erreur de l'IA serait-elle difficile à corriger ou réversible (0 = facilement réversible, 4 = irréversible) ?",
    weight: 4,
    orderIndex: 4,
  },
  {
    category: "transparence",
    text: "Les personnes concernées sont-elles informées qu'une IA est utilisée (0 = totalement transparent, 4 = aucune information donnée) ?",
    weight: 3,
    orderIndex: 5,
  },
  {
    category: "securite",
    text: "Quel est le niveau de risque de sécurité (fuite de données, accès non autorisé) associé à cet usage (0 = risque minimal, 4 = risque élevé) ?",
    weight: 4,
    orderIndex: 6,
  },
  {
    category: "dependance_fournisseur",
    text: "Quel est le niveau de dépendance vis-à-vis du fournisseur de l'outil d'IA (0 = alternatives faciles, 4 = dépendance critique) ?",
    weight: 2,
    orderIndex: 7,
  },
  {
    category: "impact_discrimination",
    text: "Quel est le risque que l'outil produise un résultat discriminatoire ou biaisé (0 = risque minimal, 4 = risque élevé) ?",
    weight: 5,
    orderIndex: 8,
  },
];

async function main() {
  for (const code of Object.values(PERMISSIONS)) {
    await prisma.permission.upsert({
      where: { code },
      create: { code, description: code },
      update: {},
    });
  }
  console.log(`Seed terminé : ${Object.values(PERMISSIONS).length} permissions.`);

  const existingGlobalQuestions = await prisma.riskQuestion.count({ where: { organizationId: null } });
  if (existingGlobalQuestions === 0) {
    await prisma.riskQuestion.createMany({
      data: RISK_QUESTIONS.map((q) => ({ ...q, organizationId: null })),
    });
    console.log(`Seed terminé : ${RISK_QUESTIONS.length} questions de risque créées.`);
  } else {
    console.log("Questions de risque déjà présentes, seed ignoré pour cette partie.");
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
