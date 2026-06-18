import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const invoices = await prisma.invoice.findMany({
    select: {
      id: true,
      invoiceNumber: true,
      pdfPath: true,
      customerName: true,
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  console.log("Invoices:", JSON.stringify(invoices, null, 2));

  const repairOrders = await prisma.repairOrder.findMany({
    select: {
      id: true,
      repairOrderNumber: true,
      customerName: true,
      customerEmail: true,
      estimatedPrice: true,
    },
    take: 5,
  });
  console.log("Repair orders:", JSON.stringify(repairOrders, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
