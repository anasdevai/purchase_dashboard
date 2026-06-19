export type AppointmentStatus = "Booked" | "Confirmed" | "Arrived" | "Cancelled" | "Voided";
export type AppointmentSource = "Manual" | "Order" | "Website";

export interface Appointment {
  id: string;
  userId: string;
  title: string;
  customerId: string | null;
  deviceBrand: string | null;
  deviceModel: string | null;
  deviceImei: string | null;
  repairOrderId: string | null;
  startTime: string;
  endTime: string;
  duration: number;
  note: string | null;
  status: AppointmentStatus;
  source: AppointmentSource;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    customerNumber: string | null;
  } | null;
  repairOrder?: {
    id: string;
    repairOrderNumber: string;
    brand: string | null;
    model: string;
    status: string;
  } | null;
}

export interface AppointmentPayload {
  title: string;
  customerId?: string | null;
  deviceBrand?: string | null;
  deviceModel?: string | null;
  deviceImei?: string | null;
  repairOrderId?: string | null;
  startTime: string;
  endTime: string;
  note?: string | null;
  status?: AppointmentStatus;
  source?: AppointmentSource;
}
