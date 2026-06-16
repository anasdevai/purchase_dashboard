CREATE TYPE "RepairOrderStatus_new" AS ENUM (
  'Open',
  'WorkPending',
  'SentToRepairCompany',
  'AppointmentScheduled',
  'Completed',
  'Cancelled'
);

ALTER TABLE "repair_orders" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "repair_orders"
ALTER COLUMN "status" TYPE "RepairOrderStatus_new"
USING (
  CASE "status"::text
    WHEN 'Received' THEN 'Open'::"RepairOrderStatus_new"
    WHEN 'InProgress' THEN 'WorkPending'::"RepairOrderStatus_new"
    WHEN 'WaitingForParts' THEN 'SentToRepairCompany'::"RepairOrderStatus_new"
    WHEN 'ReadyForPickup' THEN 'AppointmentScheduled'::"RepairOrderStatus_new"
    WHEN 'Completed' THEN 'Completed'::"RepairOrderStatus_new"
    WHEN 'Cancelled' THEN 'Cancelled'::"RepairOrderStatus_new"
  END
);

DROP TYPE "RepairOrderStatus";

ALTER TYPE "RepairOrderStatus_new" RENAME TO "RepairOrderStatus";

ALTER TABLE "repair_orders" ALTER COLUMN "status" SET DEFAULT 'Open';
