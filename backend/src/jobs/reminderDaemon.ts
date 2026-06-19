import { prisma } from "../config/prisma.js";
import { sendPickupReminderEmail } from "../services/emailService.js";

export const scanForReminders = async () => {
  console.log("[ReminderDaemon] Scanning for ready repair orders for pickup reminder...");

  const threeDaysAgoEnd = new Date();
  threeDaysAgoEnd.setDate(threeDaysAgoEnd.getDate() - 3);
  threeDaysAgoEnd.setHours(23, 59, 59, 999);

  try {
    // Find all repair orders in ReadyForPickup status updated 3 or more days ago
    const repairOrders = await prisma.repairOrder.findMany({
      where: {
        status: "ReadyForPickup",
        updatedAt: {
          lte: threeDaysAgoEnd,
        },
        customerEmail: {
          not: null,
        },
      },
    });

    console.log(`[ReminderDaemon] Found ${repairOrders.length} ready repair orders older than 3 days.`);

    for (const order of repairOrders) {
      if (!order.customerEmail) continue;

      // Deduplicate: check if a pickup reminder email was already logged
      const existingLog = await prisma.emailLog.findFirst({
        where: {
          userId: order.userId,
          to: order.customerEmail,
          subject: {
            contains: order.repairOrderNumber,
          },
          body: {
            contains: "Erinnerung", // matches default reminder text
          },
        },
      });

      if (existingLog) {
        // Reminder already sent, skip to prevent duplicate emails
        continue;
      }

      console.log(`[ReminderDaemon] Sending pickup reminder to ${order.customerEmail} for order ${order.repairOrderNumber}`);
      try {
        const deviceName = `${order.brand || ""} ${order.model}`.trim();
        
        // Calculate dynamic days ready
        const msDiff = Date.now() - new Date(order.updatedAt).getTime();
        const daysReady = Math.max(3, Math.floor(msDiff / (1000 * 60 * 60 * 24)));

        await sendPickupReminderEmail(
          order.userId,
          order.customerEmail,
          order.repairOrderNumber,
          order.customerName,
          deviceName,
          daysReady
        );
        console.log(`[ReminderDaemon] Pickup reminder sent successfully for ${order.repairOrderNumber}.`);
      } catch (err) {
        console.error(`[ReminderDaemon] Failed to send pickup reminder for ${order.repairOrderNumber}:`, err);
      }
    }
  } catch (error) {
    console.error("[ReminderDaemon] Error during pickup reminder scan:", error);
  }

  // Scan for upcoming appointments in the next 24 hours
  console.log("[ReminderDaemon] Scanning for upcoming appointments for reminders...");
  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        status: { in: ["Booked", "Confirmed"] },
        startTime: {
          gte: now,
          lte: tomorrow,
        },
        customer: {
          isNot: null,
        },
      },
      include: { customer: true, repairOrder: true },
    });

    console.log(`[ReminderDaemon] Found ${upcomingAppointments.length} upcoming appointments in the next 24h.`);

    for (const appt of upcomingAppointments) {
      if (!appt.customer?.email) continue;

      // Deduplicate: check if a reminder for this appointment was sent recently
      const existingLog = await prisma.emailLog.findFirst({
        where: {
          userId: appt.userId,
          to: appt.customer.email,
          subject: {
            contains: appt.title,
          },
          sentAt: {
            gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          },
        },
      });

      if (existingLog) continue;

      console.log(`[ReminderDaemon] Sending reminder email for appointment: ${appt.title} to ${appt.customer.email}`);
      try {
        const { sendAppointmentReminderEmail } = await import("../services/emailService.js");
        await sendAppointmentReminderEmail(appt.userId, appt.customer.email, {
          title: appt.title,
          startTime: appt.startTime,
          endTime: appt.endTime,
          customerName: appt.customer.name,
          deviceSummary: appt.deviceModel ? `${appt.deviceBrand || ""} ${appt.deviceModel}`.trim() : null,
          repairOrderNumber: appt.repairOrder?.repairOrderNumber || null,
        });
        console.log(`[ReminderDaemon] Reminder sent for appointment: ${appt.id}`);
      } catch (err) {
        console.error(`[ReminderDaemon] Failed to send reminder for appointment: ${appt.id}`, err);
      }
    }
  } catch (error) {
    console.error("[ReminderDaemon] Error during appointment reminder scan:", error);
  }
};

export const startReminderDaemon = () => {
  // Run once immediately on startup
  scanForReminders();

  // Then schedule to run every 24 hours
  const intervalMs = 24 * 60 * 60 * 1000;
  setInterval(scanForReminders, intervalMs);
  console.log("[ReminderDaemon] Scheduler initialized. Scanning once daily.");
};
