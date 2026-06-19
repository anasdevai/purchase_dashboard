import { prisma } from "../config/prisma.js";
import {
  createCustomer,
  updateCustomer,
  getCustomerDetailsWithHistory,
  mergeCustomers,
  deleteCustomer
} from "../services/customerService.js";

async function verify() {
  console.log("=== STARTING CUSTOMER MANAGEMENT VERIFICATION ===");

  // 1. Get a valid user
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error("❌ No users found in database to run verification context.");
    process.exit(1);
  }
  const userId = user.id;
  console.log(`Using verification User ID: ${userId} (${user.email})`);

  // Cleanup potential leftover verification records
  await prisma.contract.deleteMany({ where: { deviceType: "VERIFICATION-DEVICE" } });
  await prisma.repairOrder.deleteMany({ where: { deviceType: "VERIFICATION-DEVICE" } });
  await prisma.customer.deleteMany({
    where: {
      userId,
      name: { in: ["Primary Verification McTest", "Duplicate Verification McTest"] }
    }
  });

  // 2. Test Customer Creation & Auto-generated Customer Number
  console.log("\n1. Testing Customer Creation & Number Generation...");
  const primaryInput = {
    salutation: "Mr",
    firstName: "Primary Verification",
    lastName: "McTest",
    company: "Test Corp",
    vatId: "DE123456789",
    street: "Test Road 1",
    zipCode: "12345",
    city: "Test City",
    phone: "123456789",
    email: "primary@test.com",
    dateOfBirth: "1990-01-01",
    newsletter: true,
    notes: "Original Notes"
  };

  const primaryCustomer = await createCustomer(userId, primaryInput);
  console.log(`✅ Customer Created: ${primaryCustomer.name} (${primaryCustomer.id})`);
  console.log(`✅ Customer Number Generated: ${primaryCustomer.customerNumber}`);
  if (!primaryCustomer.customerNumber || !primaryCustomer.customerNumber.startsWith("CUST-")) {
    throw new Error("❌ Customer number format is incorrect or missing");
  }

  // 3. Test Updating Customer Details & Notes
  console.log("\n2. Testing Update Details & Notes...");
  const updatedCustomer = await updateCustomer(userId, primaryCustomer.id, {
    notes: "Appended VIP notes",
    company: "Updated Corp"
  });
  console.log(`✅ Updated Customer Notes: "${updatedCustomer.notes}"`);
  console.log(`✅ Updated Customer Company: "${updatedCustomer.company}"`);
  if (updatedCustomer.notes !== "Appended VIP notes" || updatedCustomer.company !== "Updated Corp") {
    throw new Error("❌ Customer update failed to save fields correctly");
  }

  // 4. Create Linked Transactions
  console.log("\n3. Creating Linked Transactions (Contract)...");
  const contract = await prisma.contract.create({
    data: {
      userId,
      customerId: primaryCustomer.id,
      contractNumber: "VERIFY-CON-001",
      customerName: primaryCustomer.name,
      customerPhone: primaryCustomer.phone,
      customerAddress: primaryCustomer.address,
      brand: "Apple",
      model: "iPhone 15 Pro",
      imei: "111222333444555",
      deviceType: "VERIFICATION-DEVICE",
      purchasePrice: 900.00,
      status: "Completed",
      pdfPath: null
    }
  });
  console.log(`✅ Created Contract: ${contract.contractNumber}`);

  // 5. Test Unified History Timeline
  console.log("\n4. Testing Timeline & Device Tracking...");
  const details = await getCustomerDetailsWithHistory(userId, primaryCustomer.id);
  console.log(`✅ Timeline Contracts Count: ${details.history.contracts.length}`);
  if (details.history.contracts.length !== 1 || details.history.contracts[0].id !== contract.id) {
    throw new Error("❌ Timeline history does not correctly link or query contracts");
  }
  console.log(`✅ Tracked Devices Count: ${details.history.devices.length}`);
  if (details.history.devices.length !== 1 || details.history.devices[0].model !== "iPhone 15 Pro") {
    throw new Error("❌ Device tracking did not extract iPhone 15 Pro from contract history");
  }

  // 6. Test Merging Duplicate Accounts
  console.log("\n5. Testing Customer Merge Deduplication...");
  const duplicateInput = {
    salutation: "Ms",
    firstName: "Duplicate Verification",
    lastName: "McTest",
    street: "Test Road 2",
    zipCode: "54321",
    city: "Test City",
    phone: "987654321",
    email: "duplicate@test.com",
    newsletter: false,
  };

  const duplicateCustomer = await createCustomer(userId, duplicateInput);
  console.log(`✅ Duplicate Customer Created: ${duplicateCustomer.name} (${duplicateCustomer.id})`);

  // Create a Repair Order linked to the duplicate customer
  const repairOrder = await prisma.repairOrder.create({
    data: {
      userId,
      customerId: duplicateCustomer.id,
      repairOrderNumber: "VERIFY-RO-001",
      customerName: duplicateCustomer.name,
      customerPhone: duplicateCustomer.phone,
      deviceType: "VERIFICATION-DEVICE",
      model: "Galaxy S24",
      problemDescription: "Screen crack",
      status: "New"
    }
  });
  console.log(`✅ Created Repair Order for Duplicate Customer: ${repairOrder.repairOrderNumber}`);

  // Merge Duplicate into Primary
  console.log("Merging duplicate into primary...");
  const mergedPrimary = await mergeCustomers(userId, primaryCustomer.id, duplicateCustomer.id);
  console.log(`✅ Merge completed. Kept Primary: ${mergedPrimary.name}`);

  // Verify duplicate customer is deleted
  const checkDuplicate = await prisma.customer.findUnique({
    where: { id: duplicateCustomer.id }
  });
  if (checkDuplicate) {
    throw new Error("❌ Duplicate customer was not deleted after merge");
  }
  console.log("✅ Duplicate customer successfully deleted from database");

  // Verify repair order is re-linked to primary customer
  const updatedRepairOrder = await prisma.repairOrder.findUnique({
    where: { id: repairOrder.id }
  });
  if (!updatedRepairOrder || updatedRepairOrder.customerId !== primaryCustomer.id) {
    throw new Error("❌ Repair order was not re-linked to primary customer");
  }
  console.log("✅ Repair order successfully shifted to primary customer");

  // Fetch updated history and check timeline
  const finalDetails = await getCustomerDetailsWithHistory(userId, primaryCustomer.id);
  console.log(`✅ Combined Timeline Contracts count: ${finalDetails.history.contracts.length}`);
  console.log(`✅ Combined Timeline Repair Orders count: ${finalDetails.history.repairOrders.length}`);
  if (finalDetails.history.repairOrders.length !== 1) {
    throw new Error("❌ Unified history timeline does not show re-linked repair order");
  }

  // 7. Test GDPR Deletion / Anonymization
  console.log("\n6. Testing GDPR Deletion...");
  await deleteCustomer(userId, primaryCustomer.id);
  const checkPrimary = await prisma.customer.findUnique({
    where: { id: primaryCustomer.id }
  });
  if (checkPrimary) {
    throw new Error("❌ Primary customer was not deleted after deleteCustomer call");
  }
  console.log("✅ Primary customer successfully deleted (GDPR-compliant)");

  // Clean up transactions
  await prisma.contract.deleteMany({ where: { deviceType: "VERIFICATION-DEVICE" } });
  await prisma.repairOrder.deleteMany({ where: { deviceType: "VERIFICATION-DEVICE" } });
  console.log("✅ Cleaned up temporary test transactions");

  console.log("\n=== ALL CUSTOMER MANAGEMENT VERIFICATIONS PASSED SUCCESSFULLY! ===");
}

verify()
  .catch((err) => {
    console.error("❌ VERIFICATION FAILED:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
