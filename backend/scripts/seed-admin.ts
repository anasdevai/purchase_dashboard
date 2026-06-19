/**
 * Seed script to create the initial admin user.
 * Usage: npx tsx scripts/seed-admin.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "admin@admin.com";
const ADMIN_PASSWORD = "admin123";
const ADMIN_NAME = "System Admin";

async function main() {
  console.log("🔧 Seeding admin user...\n");

  const existing = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  if (existing) {
    console.log(`⚠️  User with email "${ADMIN_EMAIL}" already exists.`);

    if (existing.role !== "admin") {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: "admin" },
      });
      console.log(`✅ Promoted existing user to admin role.`);
    } else {
      console.log(`✅ User is already an admin. No changes made.`);
    }

    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const user = await prisma.user.create({
    data: {
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      passwordHash,
      role: "admin",
    },
  });

  console.log(`✅ Admin user created successfully!`);
  console.log(`   ID:       ${user.id}`);
  console.log(`   Name:     ${ADMIN_NAME}`);
  console.log(`   Email:    ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log(`   Role:     admin`);
  console.log(`\n⚠️  Please change the default password after first login!`);
}

main()
  .catch((error) => {
    console.error("❌ Error seeding admin:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
