import { apiRequest, getApiBaseUrl, getToken } from "./client.js";
import type { Appointment, AppointmentPayload } from "../types/appointment";

export async function fetchAppointments(start?: string, end?: string): Promise<Appointment[]> {
  let url = "/api/appointments";
  const params: string[] = [];
  if (start) params.push(`start=${encodeURIComponent(start)}`);
  if (end) params.push(`end=${encodeURIComponent(end)}`);
  if (params.length > 0) url += `?${params.join("&")}`;

  const response = await apiRequest<{ appointments: Appointment[] }>(url);
  return response.appointments;
}

export async function fetchAppointmentDetail(id: string): Promise<Appointment> {
  const response = await apiRequest<{ appointment: Appointment }>(`/api/appointments/${id}`);
  return response.appointment;
}

export async function createAppointment(payload: AppointmentPayload): Promise<Appointment> {
  const response = await apiRequest<{ appointment: Appointment }>("/api/appointments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.appointment;
}

export async function updateAppointment(
  id: string,
  payload: Partial<AppointmentPayload>
): Promise<Appointment> {
  const response = await apiRequest<{ appointment: Appointment }>(`/api/appointments/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return response.appointment;
}

export async function moveAppointment(
  id: string,
  startTime: string,
  endTime: string
): Promise<Appointment> {
  const response = await apiRequest<{ appointment: Appointment }>(`/api/appointments/${id}/move`, {
    method: "PATCH",
    body: JSON.stringify({ startTime, endTime }),
  });
  return response.appointment;
}

export async function deleteAppointment(id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/api/appointments/${id}`, {
    method: "DELETE",
  });
}

export async function sendAppointmentReminder(id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/api/appointments/${id}/reminder`, {
    method: "POST",
  });
}

export async function exportAppointments(format: "csv" | "ical"): Promise<Blob> {
  const token = getToken();
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/appointments/export?format=${format}`, {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  });
  if (!response.ok) {
    throw new Error("Failed to export appointments");
  }
  return response.blob();
}
