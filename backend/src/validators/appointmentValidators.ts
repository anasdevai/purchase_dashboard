import { z } from "zod";

export const createAppointmentSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    customerId: z.string().uuid().optional().nullable(),
    deviceBrand: z.string().optional().nullable(),
    deviceModel: z.string().optional().nullable(),
    deviceImei: z.string().optional().nullable(),
    repairOrderId: z.string().uuid().optional().nullable(),
    startTime: z.string().datetime("Invalid start time format"),
    endTime: z.string().datetime("Invalid end time format"),
    note: z.string().optional().nullable(),
    status: z.enum(["Booked", "Confirmed", "Arrived", "Cancelled", "Voided"]).default("Booked"),
    source: z.enum(["Manual", "Order", "Website"]).default("Manual"),
  })
  .refine(
    (data) => {
      const start = new Date(data.startTime);
      const end = new Date(data.endTime);
      return end > start;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );

export const updateAppointmentSchema = z
  .object({
    title: z.string().min(1, "Title is required").optional(),
    customerId: z.string().uuid().optional().nullable(),
    deviceBrand: z.string().optional().nullable(),
    deviceModel: z.string().optional().nullable(),
    deviceImei: z.string().optional().nullable(),
    repairOrderId: z.string().uuid().optional().nullable(),
    startTime: z.string().datetime("Invalid start time format").optional(),
    endTime: z.string().datetime("Invalid end time format").optional(),
    note: z.string().optional().nullable(),
    status: z.enum(["Booked", "Confirmed", "Arrived", "Cancelled", "Voided"]).optional(),
    source: z.enum(["Manual", "Order", "Website"]).optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        const start = new Date(data.startTime);
        const end = new Date(data.endTime);
        return end > start;
      }
      return true;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );

export const moveAppointmentSchema = z
  .object({
    startTime: z.string().datetime("Invalid start time format"),
    endTime: z.string().datetime("Invalid end time format"),
  })
  .refine(
    (data) => {
      const start = new Date(data.startTime);
      const end = new Date(data.endTime);
      return end > start;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );
