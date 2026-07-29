/**
 * Seed minimal : catalogue de permissions (utilisé par DEFAULT_ROLE_PERMISSIONS lors de la
 * création d'une organisation, cf. src/app/api/organizations/route.ts). Exécuter une seule fois
 * après la première migration.
 */
import { PrismaClient } from "@prisma/client";
import { PERMISSIONS } from "../src/lib/permissions";

const prisma = new PrismaClient();

async function main() {
  for (const code of Object.values(PERMISSIONS)) {
    await prisma.permission.upsert({
      where: { code },
      create: { code, description: code },
      update: {},
    });
  }
  console.log(`Seed terminé : ${Object.values(PERMISSIONS).length} permissions.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
