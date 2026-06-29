export type InventoryAction = "stock_in" | "stock_out" | "adjustment" | "initial";

export interface InventoryHistory {
  id: string;
  product_id: string;
  user_id: string;
  action: InventoryAction;
  previous_quantity: number;
  updated_quantity: number;
  quantity_change: number;
  notes: string | null;
  created_at: string;
}

export interface InventoryHistoryWithRelations extends InventoryHistory {
  product: {
    id: string;
    name: string;
    sku: string | null;
  } | null;
  user: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
}

export interface InventoryStats {
  low_stock_count: number;
  out_of_stock_count: number;
  total_inventory_value: number;
}

export interface StockMovementValues {
  product_id: string;
  action: InventoryAction;
  quantity: number;
  notes?: string;
}
