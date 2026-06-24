import { z } from "zod";

export const createRepairRequestSchema = z.object({
  shopId: z.string().uuid("Invalid shop ID"),
  customerName: z.string().trim().min(1, "Customer name is required").max(255),
  customerEmail: z.string().trim().email("Invalid email address").max(255),
  customerPhone: z.string().trim().min(1, "Phone number is required").max(50),
  deviceBrand: z.string().trim().min(1, "Device brand is required"),
  deviceType: z.string().trim().min(1, "Device type is required"),
  deviceModel: z.string().trim().min(1, "Device model is required"),
  repairType: z.string().trim().min(1, "Repair type is required"),
  issueDescription: z.string().trim().min(1, "Issue description is required"),
  preferredAppointment: z.string().optional().refine((val) => {
    if (!val) return true;
    const d = new Date(val);
    return !isNaN(d.getTime());
  }, "Invalid appointment date").transform((val) => val ? new Date(val) : undefined),
});

export const updateRepairRequestStatusSchema = z.object({
  status: z.enum(["New", "Seen", "Contacted", "Completed"]),
});
