import { prisma } from "../config/prisma.js";
import { HttpError } from "../utils/httpError.js";
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  moveAppointmentSchema
} from "../validators/appointmentValidators.js";
import {
  sendAppointmentConfirmationEmail,
  sendAppointmentReminderEmail
} from "./emailService.js";
import {
  createGoogleEvent,
  updateGoogleEvent,
  deleteGoogleEvent
} from "./googleCalendarService.js";

// Helper to format dates to iCal format (YYYYMMDDTHHMMSSZ)
const formatDateToICal = (date: Date): string => {
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hours = String(d.getUTCHours()).padStart(2, "0");
  const minutes = String(d.getUTCMinutes()).padStart(2, "0");
  const seconds = String(d.getUTCSeconds()).padStart(2, "0");
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
};

export const getAppointments = async (
  userId: string,
  start?: string,
  end?: string
) => {
  const whereClause: any = { userId };

  if (start || end) {
    whereClause.startTime = {};
    if (start) {
      whereClause.startTime.gte = new Date(start);
    }
    if (end) {
      whereClause.startTime.lte = new Date(end);
    }
  }

  return prisma.appointment.findMany({
    where: whereClause,
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          customerNumber: true
        }
      },
      repairOrder: {
        select: {
          id: true,
          repairOrderNumber: true,
          brand: true,
          model: true,
          status: true
        }
      }
    },
    orderBy: { startTime: "asc" }
  });
};

export const getAppointmentOrThrow = async (id: string, userId: string) => {
  const appointment = await prisma.appointment.findFirst({
    where: { id, userId },
    include: {
      customer: true,
      repairOrder: true
    }
  });

  if (!appointment) {
    throw new HttpError(404, "Appointment not found");
  }

  return appointment;
};

export const createAppointment = async (
  userId: string,
  input: Record<string, unknown>
) => {
  const parsed = createAppointmentSchema.parse(input);

  const start = new Date(parsed.startTime);
  const end = new Date(parsed.endTime);
  const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // duration in minutes

  // Sync with Google Calendar if integrated
  let googleCalendarEventId: string | null = null;
  try {
    googleCalendarEventId = await createGoogleEvent(userId, {
      title: parsed.title,
      startTime: start,
      endTime: end,
      note: parsed.note
    });
  } catch (err) {
    console.error("Failed to sync new appointment to Google Calendar:", err);
  }

  const appointment = await prisma.appointment.create({
    data: {
      userId,
      title: parsed.title,
      customerId: parsed.customerId || null,
      deviceBrand: parsed.deviceBrand || null,
      deviceModel: parsed.deviceModel || null,
      deviceImei: parsed.deviceImei || null,
      repairOrderId: parsed.repairOrderId || null,
      startTime: start,
      endTime: end,
      duration,
      note: parsed.note || null,
      status: parsed.status,
      source: parsed.source,
      googleCalendarEventId
    },
    include: {
      customer: true,
      repairOrder: true
    }
  });

  // Try sending confirmation email if customer has an email address
  if (appointment.customer?.email) {
    try {
      await sendAppointmentConfirmationEmail(userId, appointment.customer.email, {
        title: appointment.title,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        customerName: appointment.customer.name,
        deviceSummary: appointment.deviceModel ? `${appointment.deviceBrand || ""} ${appointment.deviceModel}`.trim() : null,
        repairOrderNumber: appointment.repairOrder?.repairOrderNumber || null
      });
    } catch (err) {
      console.error("Failed to send appointment confirmation email:", err);
    }
  }

  return appointment;
};

export const updateAppointment = async (
  userId: string,
  id: string,
  input: Record<string, unknown>
) => {
  const existing = await getAppointmentOrThrow(id, userId);
  const parsed = updateAppointmentSchema.parse(input);

  const startTime = parsed.startTime ? new Date(parsed.startTime) : existing.startTime;
  const endTime = parsed.endTime ? new Date(parsed.endTime) : existing.endTime;
  const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

  let googleCalendarEventId = existing.googleCalendarEventId;
  try {
    if (googleCalendarEventId) {
      await updateGoogleEvent(userId, googleCalendarEventId, {
        title: parsed.title !== undefined ? parsed.title : existing.title,
        startTime,
        endTime,
        note: parsed.note !== undefined ? parsed.note : existing.note
      });
    } else {
      googleCalendarEventId = await createGoogleEvent(userId, {
        title: parsed.title !== undefined ? parsed.title : existing.title,
        startTime,
        endTime,
        note: parsed.note !== undefined ? parsed.note : existing.note
      });
    }
  } catch (err) {
    console.error("Failed to sync updated appointment to Google Calendar:", err);
  }

  return prisma.appointment.update({
    where: { id: existing.id },
    data: {
      title: parsed.title !== undefined ? parsed.title : existing.title,
      customerId: parsed.customerId !== undefined ? parsed.customerId : existing.customerId,
      deviceBrand: parsed.deviceBrand !== undefined ? parsed.deviceBrand : existing.deviceBrand,
      deviceModel: parsed.deviceModel !== undefined ? parsed.deviceModel : existing.deviceModel,
      deviceImei: parsed.deviceImei !== undefined ? parsed.deviceImei : existing.deviceImei,
      repairOrderId: parsed.repairOrderId !== undefined ? parsed.repairOrderId : existing.repairOrderId,
      startTime,
      endTime,
      duration,
      note: parsed.note !== undefined ? parsed.note : existing.note,
      status: parsed.status !== undefined ? parsed.status : existing.status,
      source: parsed.source !== undefined ? parsed.source : existing.source,
      googleCalendarEventId
    },
    include: {
      customer: true,
      repairOrder: true
    }
  });
};

export const moveAppointment = async (
  userId: string,
  id: string,
  input: Record<string, unknown>
) => {
  const existing = await getAppointmentOrThrow(id, userId);
  const parsed = moveAppointmentSchema.parse(input);

  const startTime = new Date(parsed.startTime);
  const endTime = new Date(parsed.endTime);
  const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

  if (existing.googleCalendarEventId) {
    try {
      await updateGoogleEvent(userId, existing.googleCalendarEventId, {
        title: existing.title,
        startTime,
        endTime,
        note: existing.note
      });
    } catch (err) {
      console.error("Failed to sync moved appointment to Google Calendar:", err);
    }
  }

  return prisma.appointment.update({
    where: { id: existing.id },
    data: {
      startTime,
      endTime,
      duration
    },
    include: {
      customer: true,
      repairOrder: true
    }
  });
};

export const deleteAppointment = async (userId: string, id: string) => {
  const appointment = await getAppointmentOrThrow(id, userId);

  if (appointment.googleCalendarEventId) {
    try {
      await deleteGoogleEvent(userId, appointment.googleCalendarEventId);
    } catch (err) {
      console.error("Failed to delete event from Google Calendar:", err);
    }
  }

  await prisma.appointment.delete({
    where: { id: appointment.id }
  });
  return { success: true };
};

export const triggerReminder = async (userId: string, id: string) => {
  const appointment = await getAppointmentOrThrow(id, userId);
  if (!appointment.customer?.email) {
    throw new HttpError(400, "Customer does not have a valid email address");
  }

  await sendAppointmentReminderEmail(userId, appointment.customer.email, {
    title: appointment.title,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    customerName: appointment.customer.name,
    deviceSummary: appointment.deviceModel ? `${appointment.deviceBrand || ""} ${appointment.deviceModel}`.trim() : null,
    repairOrderNumber: appointment.repairOrder?.repairOrderNumber || null
  });

  return { success: true };
};

export const exportAppointmentsData = async (userId: string, format = "csv") => {
  const appointments = await prisma.appointment.findMany({
    where: { userId },
    include: { customer: true, repairOrder: true },
    orderBy: { startTime: "desc" }
  });

  if (format === "csv") {
    const headers = [
      "Title",
      "Customer Name",
      "Device",
      "Repair Order Number",
      "Start Time",
      "End Time",
      "Duration (Minutes)",
      "Status",
      "Source",
      "Note"
    ];

    const rows = appointments.map((a) => [
      a.title,
      a.customer?.name || "",
      a.deviceModel ? `${a.deviceBrand || ""} ${a.deviceModel}`.trim() : "",
      a.repairOrder?.repairOrderNumber || "",
      a.startTime.toISOString(),
      a.endTime.toISOString(),
      String(a.duration),
      a.status,
      a.source,
      (a.note || "").replace(/"/g, '""').replace(/\n/g, " ")
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((val) => `"${val}"`).join(","))
    ].join("\n");

    return {
      contentType: "text/csv",
      filename: `appointments_export_${new Date().toISOString().split("T")[0]}.csv`,
      data: Buffer.from(csvContent, "utf-8")
    };
  }

  if (format === "ical") {
    const calendarLines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Sclera//NONSGML Calendar Export//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH"
    ];

    for (const a of appointments) {
      calendarLines.push("BEGIN:VEVENT");
      calendarLines.push(`UID:${a.id}`);
      calendarLines.push(`DTSTAMP:${formatDateToICal(a.createdAt)}`);
      calendarLines.push(`DTSTART:${formatDateToICal(a.startTime)}`);
      calendarLines.push(`DTEND:${formatDateToICal(a.endTime)}`);
      calendarLines.push(`SUMMARY:${a.title}`);
      
      let description = `Status: ${a.status}\\nSource: ${a.source}`;
      if (a.customer) {
        description += `\\nKunde: ${a.customer.name} (${a.customer.customerNumber || ""})`;
      }
      if (a.deviceModel) {
        description += `\\nGerät: ${a.deviceBrand || ""} ${a.deviceModel}`;
      }
      if (a.repairOrder) {
        description += `\\nReparaturauftrag: ${a.repairOrder.repairOrderNumber}`;
      }
      if (a.note) {
        description += `\\nNotiz: ${a.note.replace(/\n/g, "\\n")}`;
      }
      calendarLines.push(`DESCRIPTION:${description}`);
      calendarLines.push("END:VEVENT");
    }

    calendarLines.push("END:VCALENDAR");
    const icalContent = calendarLines.join("\r\n");

    return {
      contentType: "text/calendar",
      filename: `appointments_export_${new Date().toISOString().split("T")[0]}.ics`,
      data: Buffer.from(icalContent, "utf-8")
    };
  }

  throw new HttpError(400, `Unsupported export format: ${format}`);
};

export const createPickupAppointmentFromOrder = async (
  userId: string,
  repairOrderId: string,
  pickupTime: string
) => {
  const repairOrder = await prisma.repairOrder.findFirst({
    where: { id: repairOrderId, userId },
    include: { customer: true }
  });

  if (!repairOrder) {
    throw new HttpError(404, "Repair order not found");
  }

  const start = new Date(pickupTime);
  const end = new Date(start.getTime() + 30 * 60 * 1000); // 30 minutes duration by default
  const duration = 30;

  const title = `Abholung: ${repairOrder.brand || ""} ${repairOrder.model} (${repairOrder.repairOrderNumber})`;

  // Check if pickup appointment already exists for this repair order
  const existing = await prisma.appointment.findFirst({
    where: { userId, repairOrderId: repairOrder.id }
  });

  if (existing) {
    return existing;
  }

  // Sync with Google Calendar if integrated
  let googleCalendarEventId: string | null = null;
  try {
    googleCalendarEventId = await createGoogleEvent(userId, {
      title,
      startTime: start,
      endTime: end,
      note: "Automatisch generierter Abholtermin."
    });
  } catch (err) {
    console.error("Failed to sync pickup appointment to Google Calendar:", err);
  }

  const appointment = await prisma.appointment.create({
    data: {
      userId,
      title,
      customerId: repairOrder.customerId || null,
      deviceBrand: repairOrder.brand || null,
      deviceModel: repairOrder.model,
      deviceImei: repairOrder.imeiOrSerial || null,
      repairOrderId: repairOrder.id,
      startTime: start,
      endTime: end,
      duration,
      note: "Automatisch generierter Abholtermin.",
      status: "Booked",
      source: "Order",
      googleCalendarEventId
    },
    include: {
      customer: true,
      repairOrder: true
    }
  });

  // Try sending confirmation email if customer has an email address
  if (appointment.customer?.email) {
    try {
      await sendAppointmentConfirmationEmail(userId, appointment.customer.email, {
        title: appointment.title,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        customerName: appointment.customer.name,
        deviceSummary: `${appointment.deviceBrand || ""} ${appointment.deviceModel}`.trim(),
        repairOrderNumber: repairOrder.repairOrderNumber
      });
    } catch (err) {
      console.error("Failed to send pickup confirmation email:", err);
    }
  }

  return appointment;
};
