import { seedPrincipal } from "./principal.seed.js";
import { seedAdmin } from "./admin.seed.js";
import { prisma } from "../lib/prisma.js";
import { seedDepartments } from "./department.seed.js";
import { seedSemesters } from "./semester.seed.js";
;



async function main() {
  await seedPrincipal();
  await seedAdmin();
  await seedDepartments();
  await seedSemesters()
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });