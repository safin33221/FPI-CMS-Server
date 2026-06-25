import { seedPrincipal } from "./principal.seed.js";
import { seedAdmin } from "./admin.seed.js";
import { prisma } from "../lib/prisma.js";
;



async function main() {
  await seedPrincipal();
  await seedAdmin();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });