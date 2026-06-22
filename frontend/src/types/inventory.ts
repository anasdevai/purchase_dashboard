export interface Supplier {
  id: string;
  companyName: string;
  contactPerson: string | null;
  phone: string | null;
  email: string;
  website: string | null;
  deliveryTime: number | null;
  paymentTerms: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SparePart {
  id: string;
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
  createdAt: string;
  updatedAt: string;
  supplier?: Supplier;
}

export type InventoryOrderStatus = 'Ordered' | 'Shipped' | 'PartiallyDelivered' | 'Delivered' | 'Cancelled';

export interface InventoryOrderItem {
  id: string;
  orderId: string;
  sparePartId: string;
  quantityOrdered: number;
  quantityReceived: number;
  sparePart?: SparePart;
}

export interface InventoryOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  status: InventoryOrderStatus;
  orderDate: string;
  expectedDate: string | null;
  createdAt: string;
  updatedAt: string;
  supplier?: Supplier;
  items?: InventoryOrderItem[];
}

export interface GoodsReceipt {
  id: string;
  orderId: string;
  receivedDate: string;
  notes: string | null;
  order?: {
    id: string;
    orderNumber: string;
    status: InventoryOrderStatus;
    supplier: {
      companyName: string;
    };
  };
}

export interface StockAdjustment {
  id: string;
  sparePartId: string;
  quantityDiff: number;
  reason: string;
  createdAt: string;
  sparePart?: {
    id: string;
    itemNumber: string;
    name: string;
  };
}

export interface BookReceiptResult {
  receipt: GoodsReceipt;
  orderStatus: string;
  hasDeviations: boolean;
  deviations: {
    sparePartId: string;
    name: string;
    ordered: number;
    received: number;
    deviation: number;
  }[];
}
