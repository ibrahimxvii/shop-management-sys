export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentMethod = "cash" | "card" | "bank_transfer" | "online";

export type PaymentStatus = "unpaid" | "partial" | "paid" | "refunded";

export interface Customer {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  postal_code: string | null;
  notes: string | null;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string | null;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  shipping_amount: number;
  grand_total: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  total_price: number;
  created_at: string;
}

export interface OrderItemWithProduct extends OrderItem {
  product: {
    id: string;
    name: string;
    sku: string | null;
    selling_price: number;
  } | null;
}

export interface Payment {
  id: string;
  order_id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  transaction_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface OrderWithRelations extends Order {
  customer: Customer | null;
  items: OrderItemWithProduct[];
  payments: Payment[];
}

export interface OrderFilters {
  search?: string;
  status?: OrderStatus | "all";
  payment_status?: PaymentStatus | "all";
  customer_id?: string;
  limit?: number;
  offset?: number;
}

export interface OrderStats {
  total_orders: number;
  pending_orders: number;
  completed_orders: number;
  total_revenue: number;
}

export interface OrderReturnItem {
  id: string;
  return_id: string;
  order_item_id: string;
  product_id: string;
  quantity: number;
  unit_refund: number;
  created_at: string;
}

export interface OrderReturnItemWithProduct extends OrderReturnItem {
  product: {
    id: string;
    name: string;
    sku: string | null;
  } | null;
}

export interface OrderReturn {
  id: string;
  order_id: string;
  user_id: string | null;
  reason: string | null;
  refund_amount: number;
  refund_method: PaymentMethod;
  created_at: string;
}

export interface OrderReturnWithItems extends OrderReturn {
  items: OrderReturnItemWithProduct[];
}
