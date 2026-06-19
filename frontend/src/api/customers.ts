import { apiRequest, getApiBaseUrl, getToken } from "./client";
import type {
  Customer,
  CustomerPayload,
  CustomerDetailsWithHistory,
  CustomerListResponse,
} from "../types/customer";

export type { Customer, CustomerPayload };

export async function searchCustomers(query: string): Promise<Customer[]> {
  const response = await apiRequest<{ customers: Customer[] }>(
    `/api/customers/search?q=${encodeURIComponent(query)}`
  );
  return response.customers;
}

export async function fetchCustomersList(
  page = 1,
  limit = 15,
  query = ""
): Promise<CustomerListResponse> {
  return apiRequest<CustomerListResponse>(
    `/api/customers?page=${page}&limit=${limit}&q=${encodeURIComponent(query)}`
  );
}

export async function createCustomer(payload: CustomerPayload): Promise<Customer> {
  const response = await apiRequest<{ customer: Customer }>("/api/customers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.customer;
}

export async function fetchCustomerDetail(id: string): Promise<CustomerDetailsWithHistory> {
  return apiRequest<CustomerDetailsWithHistory>(`/api/customers/${id}`);
}

export async function updateCustomer(
  id: string,
  payload: Partial<CustomerPayload>
): Promise<Customer> {
  const response = await apiRequest<{ customer: Customer }>(`/api/customers/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return response.customer;
}

export async function deleteCustomer(id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/api/customers/${id}`, {
    method: "DELETE",
  });
}

export async function mergeCustomers(
  keepCustomerId: string,
  mergeCustomerId: string
): Promise<{ customer: Customer }> {
  return apiRequest<{ customer: Customer }>("/api/customers/merge", {
    method: "POST",
    body: JSON.stringify({ keepCustomerId, mergeCustomerId }),
  });
}

export async function exportCustomers(format = "csv"): Promise<Blob> {
  const token = getToken();
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/customers/export?format=${format}`, {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  });
  if (!response.ok) {
    throw new Error("Failed to export customers");
  }
  return response.blob();
}
