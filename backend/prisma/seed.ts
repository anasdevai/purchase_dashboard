import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const DEV_ADMIN_EMAIL = "admin@example.com";
const DEV_ADMIN_PASSWORD = "Admin123456";

async function main() {
  const email = DEV_ADMIN_EMAIL.toLowerCase();
  const passwordHash = await bcrypt.hash(DEV_ADMIN_PASSWORD, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: "Admin User",
      passwordHash,
      role: "admin",
      isActive: true,
    },
    create: {
      name: "Admin User",
      email,
      passwordHash,
      role: "admin",
      isActive: true,
    },
    select: { email: true, role: true, isActive: true },
  });

  console.log("Seed complete.");
  console.log(`  Admin user: ${user.email} (role: ${user.role}, active: ${user.isActive})`);
  console.log("  Dev login password is set via seed — use only in local development.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
