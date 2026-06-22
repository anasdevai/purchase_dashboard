import { apiRequest } from "./client";
import type {
  Supplier,
  SparePart,
  InventoryOrder,
  GoodsReceipt,
  StockAdjustment,
  BookReceiptResult,
} from "../types/inventory";

// --- Suppliers API ---
export async function fetchSuppliers(): Promise<Supplier[]> {
  const response = await apiRequest<{ suppliers: Supplier[] }>("/api/inventory/suppliers");
  return response.suppliers;
}

export async function fetchSupplierDetail(id: string): Promise<Supplier> {
  const response = await apiRequest<{ supplier: Supplier }>(`/api/inventory/suppliers/${id}`);
  return response.supplier;
}

export async function createSupplier(payload: Omit<Supplier, "id" | "createdAt" | "updatedAt">): Promise<Supplier> {
  const response = await apiRequest<{ supplier: Supplier }>("/api/inventory/suppliers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.supplier;
}

export async function updateSupplier(id: string, payload: Partial<Supplier>): Promise<Supplier> {
  const response = await apiRequest<{ supplier: Supplier }>(`/api/inventory/suppliers/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return response.supplier;
}

export async function deleteSupplier(id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/api/inventory/suppliers/${id}`, {
    method: "DELETE",
  });
}

// --- Spare Parts API ---
export async function fetchSpareParts(category?: string, activeOnly = false): Promise<SparePart[]> {
  let url = "/api/inventory/parts";
  const params: string[] = [];
  if (category) params.push(`category=${encodeURIComponent(category)}`);
  if (activeOnly) params.push(`activeOnly=true`);
  if (params.length > 0) url += `?${params.join("&")}`;

  const response = await apiRequest<{ spareParts: SparePart[] }>(url);
  return response.spareParts;
}

export async function fetchSparePartDetail(id: string): Promise<SparePart> {
  const response = await apiRequest<{ sparePart: SparePart }>(`/api/inventory/parts/${id}`);
  return response.sparePart;
}

export async function createSparePart(payload: {
  itemNumber: string;
  name: string;
  category: string;
  compatibility?: string | null;
  stock: number;
  minimumStock: number;
  supplierId?: string | null;
  purchasePrice: number;
  salePrice: number;
  storageLocation?: string | null;
  isActive: boolean;
}): Promise<SparePart> {
  const response = await apiRequest<{ sparePart: SparePart }>("/api/inventory/parts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.sparePart;
}

export async function updateSparePart(
  id: string,
  payload: Partial<{
    itemNumber: string;
    name: string;
    category: string;
    compatibility: string | null;
    stock: number;
    minimumStock: number;
    supplierId: string | null;
    purchasePrice: number;
    salePrice: number;
    storageLocation: string | null;
    isActive: boolean;
  }>
): Promise<SparePart> {
  const response = await apiRequest<{ sparePart: SparePart }>(`/api/inventory/parts/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return response.sparePart;
}

export async function deleteSparePart(id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/api/inventory/parts/${id}`, {
    method: "DELETE",
  });
}

export async function adjustStock(
  id: string,
  payload: { quantityDiff: number; reason: string }
): Promise<{ part: SparePart; adjustment: StockAdjustment }> {
  return apiRequest<{ part: SparePart; adjustment: StockAdjustment }>(`/api/inventory/parts/${id}/adjust-stock`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchStockAdjustments(sparePartId?: string): Promise<StockAdjustment[]> {
  let url = "/api/inventory/parts/adjustments/history";
  if (sparePartId) {
    url += `?sparePartId=${sparePartId}`;
  }
  const response = await apiRequest<{ adjustments: StockAdjustment[] }>(url);
  return response.adjustments;
}

// --- Purchase Orders API ---
export async function fetchOrders(supplierId?: string, status?: string): Promise<InventoryOrder[]> {
  let url = "/api/inventory/orders";
  const params: string[] = [];
  if (supplierId) params.push(`supplierId=${supplierId}`);
  if (status) params.push(`status=${status}`);
  if (params.length > 0) url += `?${params.join("&")}`;

  const response = await apiRequest<{ orders: InventoryOrder[] }>(url);
  return response.orders;
}

export async function fetchOrderDetail(id: string): Promise<InventoryOrder> {
  const response = await apiRequest<{ order: InventoryOrder }>(`/api/inventory/orders/${id}`);
  return response.order;
}

export async function createOrder(payload: {
  supplierId: string;
  items: { sparePartId: string; quantity: number }[];
  expectedDate?: string;
}): Promise<InventoryOrder> {
  const response = await apiRequest<{ order: InventoryOrder }>("/api/inventory/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.order;
}

export async function cancelOrder(id: string): Promise<InventoryOrder> {
  const response = await apiRequest<{ order: InventoryOrder }>(`/api/inventory/orders/${id}/cancel`, {
    method: "POST",
  });
  return response.order;
}

// --- Goods Receipts API ---
export async function fetchReceipts(orderId?: string): Promise<GoodsReceipt[]> {
  let url = "/api/inventory/receipts";
  if (orderId) url += `?orderId=${orderId}`;
  const response = await apiRequest<{ receipts: GoodsReceipt[] }>(url);
  return response.receipts;
}

export async function createReceipt(payload: {
  orderId: string;
  items: { sparePartId: string; quantityReceived: number }[];
  notes?: string;
}): Promise<BookReceiptResult> {
  return apiRequest<BookReceiptResult>("/api/inventory/receipts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
