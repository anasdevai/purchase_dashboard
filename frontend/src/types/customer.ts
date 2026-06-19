import type { Contract } from "./contract";
import type { Invoice } from "./invoice";
import type { RepairOrder } from "./repairOrder";
import type { Quotation } from "./quotation";

export type CustomerSalutation = "Mr" | "Ms" | "Diverse";

export interface Customer {
  id: string;
  userId: string;
  customerNumber: string | null;
  salutation: CustomerSalutation | null;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  vatId: string | null;
  street: string | null;
  zipCode: string | null;
  city: string | null;
  dateOfBirth: string | null;
  newsletter: boolean;
  notes: string | null;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LinkedDevice {
  brand: string;
  model: string;
  imeiOrSerial: string;
  deviceType: string;
  source: string;
  createdAt: string;
}

export interface CustomerHistory {
  contracts: Contract[];
  invoices: Invoice[];
  repairOrders: RepairOrder[];
  quotations: Quotation[];
  devices: LinkedDevice[];
}

export interface CustomerDetailsWithHistory {
  customer: Customer;
  history: CustomerHistory;
}

export interface CustomerPayload {
  salutation?: CustomerSalutation | null;
  firstName: string;
  lastName: string;
  company?: string | null;
  vatId?: string | null;
  street: string;
  zipCode: string;
  city: string;
  phone: string;
  email: string;
  dateOfBirth?: string | null;
  newsletter?: boolean;
  notes?: string | null;
}

export interface CustomerListResponse {
  customers: Customer[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
