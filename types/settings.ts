export interface ShopSettings {
  id: string;
  shop_name: string;
  shop_email: string | null;
  shop_phone: string | null;
  shop_address: string | null;
  shop_city: string | null;
  shop_country: string;
  shop_logo_url: string | null;
  shop_logo_path: string | null;
  currency: string;
  currency_symbol: string;
  timezone: string;
  date_format: string;
  language: string;
  tax_percentage: number;
  default_low_stock_limit: number;
  created_at: string;
  updated_at: string;
}

export type Theme = "light" | "dark" | "system";
export type DashboardView = "overview" | "sales" | "inventory" | "orders";
export type ItemsPerPage = 10 | 25 | 50 | 100;

export interface UserPreferences {
  id: string;
  user_id: string;
  theme: Theme;
  sidebar_collapsed: boolean;
  dashboard_default_view: DashboardView;
  items_per_page: ItemsPerPage;
  created_at: string;
  updated_at: string;
}

export type ActivityAction =
  | "login"
  | "logout"
  | "logout_all"
  | "create"
  | "update"
  | "delete"
  | "view"
  | "export"
  | "import"
  | "settings_change"
  | "stock_in"
  | "stock_out"
  | "stock_adjust"
  | "password_change";

export type ActivityResource =
  | "auth"
  | "product"
  | "category"
  | "brand"
  | "inventory"
  | "order"
  | "customer"
  | "employee"
  | "settings"
  | "user_preferences"
  | "backup"
  | "report";

export interface ActivityLog {
  id: string;
  user_id: string | null;
  user_name: string | null;
  action: ActivityAction;
  resource: ActivityResource;
  resource_id: string | null;
  description: string;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

export interface LoginHistoryEntry {
  id: string;
  user_id: string;
  ip_address: string | null;
  user_agent: string | null;
  status: "success" | "failed";
  created_at: string;
}

export interface ActivityLogFilters {
  search?: string;
  action?: ActivityAction | "";
  resource?: ActivityResource | "";
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}
