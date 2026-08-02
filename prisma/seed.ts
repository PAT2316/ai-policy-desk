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

  // Formation de démonstration (organizationId: null → partagée par toutes les organisations).
  // Il n'existe pas encore d'écran d'auteur de formation dans le MVP (cf. README) : ce seed
  // fournit un contenu réel pour que le module Formations soit testable de bout en bout.
  const existingCourses = await prisma.trainingCourse.count({ where: { organizationId: null } });
  if (existingCourses === 0) {
    await prisma.trainingCourse.create({
      data: {
        organizationId: null,
        title: "Sensibilisation à l'usage responsable de l'IA",
        description:
          "Formation courte couvrant les bonnes pratiques de base : confidentialité des données, vérification des résultats, et signalement des incidents.",
        language: "fr",
        modules: {
          create: [
            {
              title: "Les fondamentaux",
              orderIndex: 1,
              content:
                "Les outils d'IA générative peuvent produire des erreurs (\"hallucinations\") et ne doivent jamais être utilisés avec des données confidentielles sans validation préalable. Toute sortie générée par IA destinée à un client ou à une décision importante doit être relue par un humain avant utilisation. En cas de doute sur la fiabilité d'un résultat ou d'un comportement inhabituel de l'outil, il faut le signaler au responsable IA de l'organisation plutôt que de l'ignorer.",
              quiz: {
                create: {
                  title: "Quiz de validation",
                  passingScore: 70,
                  questions: {
                    create: [
                      {
                        text: "Une sortie générée par une IA peut-elle contenir des erreurs factuelles ?",
                        optionsJson: JSON.stringify(["Oui, toujours vérifier", "Non, jamais", "Seulement en anglais"]),
                        correctAnswer: "Oui, toujours vérifier",
                        orderIndex: 1,
                      },
                      {
                        text: "Que faire avant d'envoyer un contenu généré par IA à un client ?",
                        optionsJson: JSON.stringify(["L'envoyer directement", "Le faire relire par un humain", "Le traduire"]),
                        correctAnswer: "Le faire relire par un humain",
                        orderIndex: 2,
                      },
                      {
                        text: "Que faire si un outil d'IA se comporte de façon inhabituelle ?",
                        optionsJson: JSON.stringify(["L'ignorer", "Le signaler au responsable IA", "Redémarrer l'ordinateur"]),
                        correctAnswer: "Le signaler au responsable IA",
                        orderIndex: 3,
                      },
                    ],
                  },
                },
              },
            },
          ],
        },
      },
    });
    console.log("Seed terminé : formation de démonstration créée.");
  } else {
    console.log("Formations déjà présentes, seed ignoré pour cette partie.");
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
