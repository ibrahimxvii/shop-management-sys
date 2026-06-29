export interface MonthlyRevenue {
  period_label: string;
  period_start: string;
  revenue: number;
  order_count: number;
}

export interface WeeklySales {
  period_label: string;
  period_start: string;
  revenue: number;
  order_count: number;
}

export interface DailySales {
  date: string;
  revenue: number;
  orders: number;
}

export interface BestSellingProduct {
  product_id: string;
  product_name: string;
  sku: string | null;
  category_name: string | null;
  total_quantity: number;
  total_revenue: number;
  order_count: number;
}

export interface TopCategory {
  category_id: string;
  category_name: string;
  total_revenue: number;
  product_count: number;
  order_count: number;
}

export interface TopCustomer {
  customer_id: string;
  customer_name: string;
  email: string | null;
  total_orders: number;
  total_spending: number;
  last_order_date: string | null;
}

export interface AnalyticsOverview {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  avgOrderValue: number;
  totalInventoryValue: number;
}

export interface AnalyticsData {
  overview: AnalyticsOverview;
  monthlyRevenue: MonthlyRevenue[];
  weeklySales: WeeklySales[];
  bestSellingProducts: BestSellingProduct[];
  topCategories: TopCategory[];
  topCustomers: TopCustomer[];
}

// Reports
export type ReportPeriod = "daily" | "weekly" | "monthly" | "yearly";

export interface SalesReportRow {
  period_label: string;
  period_start: string;
  orders: number;
  revenue: number;
  avg_order_value: number;
  cancelled_orders: number;
  refunded_orders: number;
}

export interface InventoryReportRow {
  product_id: string;
  product_name: string;
  sku: string | null;
  category: string | null;
  current_stock: number;
  low_stock_limit: number;
  stock_status: "in_stock" | "low_stock" | "out_of_stock";
  selling_price: number;
  inventory_value: number;
}

export interface OrdersReportRow {
  status: string;
  count: number;
  revenue: number;
  percentage: number;
}

export interface CustomerReportRow {
  customer_id: string;
  customer_name: string;
  email: string | null;
  joined: string;
  total_orders: number;
  total_spending: number;
  last_order_date: string | null;
  is_returning: boolean;
}
