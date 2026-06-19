import { prisma } from "../config/prisma.js";

async function main() {
  console.log("Starting customer database migration...");

  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "asc" }
  });

  console.log(`Found ${customers.length} customers to inspect.`);

  let migratedCount = 0;
  for (let i = 0; i < customers.length; i++) {
    const customer = customers[i];
    
    // Check if already migrated
    if (customer.customerNumber) {
      continue;
    }

    const customerNumber = `CUST-${10001 + i}`;
    
    // Split name
    const nameParts = (customer.name || "").trim().split(/\s+/);
    let firstName = "";
    let lastName = "";
    if (nameParts.length === 1) {
      firstName = nameParts[0];
    } else {
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(" ");
    }

    // Split address: e.g. "Musterstraße 12, 12345 Musterstadt"
    let street = customer.address || "";
    let zipCode = "";
    let city = "";
    if (customer.address) {
      const addressParts = customer.address.split(",");
      if (addressParts.length >= 2) {
        street = addressParts[0].trim();
        const zipCityParts = addressParts[1].trim().split(/\s+/);
        if (zipCityParts.length >= 2) {
          zipCode = zipCityParts[0].trim();
          city = zipCityParts.slice(1).join(" ").trim();
        } else {
          city = addressParts[1].trim();
        }
      }
    }

    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        customerNumber,
        firstName,
        lastName,
        street,
        zipCode,
        city,
        newsletter: false,
      }
    });

    migratedCount++;
    console.log(`Migrated customer ${customer.name} -> ${customerNumber} (First: ${firstName}, Last: ${lastName}, Street: ${street}, ZIP: ${zipCode}, City: ${city})`);
  }

  console.log(`Migration complete! Successfully migrated ${migratedCount} customers.`);
}

main()
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
