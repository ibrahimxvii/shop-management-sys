import type { Supplier } from "@/types/suppliers";

export type PurchaseOrderStatus = "pending" | "received" | "cancelled";

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  status: PurchaseOrderStatus;
  total_amount: number;
  notes: string | null;
  created_by: string | null;
  received_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  created_at: string;
}

export interface PurchaseOrderItemWithProduct extends PurchaseOrderItem {
  product: {
    id: string;
    name: string;
    sku: string | null;
  } | null;
}

export interface PurchaseOrderWithRelations extends PurchaseOrder {
  supplier: Supplier | null;
  items: PurchaseOrderItemWithProduct[];
}

export interface PurchaseOrderFilters {
  search?: string;
  status?: PurchaseOrderStatus | "all";
  supplier_id?: string;
}
