export type { Database } from "./database";
export type { User, UserRole, Session, AuthState } from "./auth";
export type {
  ShopSettings,
  UserPreferences,
  ActivityLog,
  ActivityAction,
  ActivityResource,
  ActivityLogFilters,
  LoginHistoryEntry,
  Theme,
  DashboardView,
  ItemsPerPage,
} from "./settings";
export type {
  Category,
  Brand,
  Product,
  ProductImage,
  ProductWithRelations,
  ProductStatus,
  ProductFilters,
  DashboardStats,
} from "./products";

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface SelectOption {
  label: string;
  value: string;
}

export type SortDirection = "asc" | "desc";

export interface SortConfig {
  column: string;
  direction: SortDirection;
}

export interface FilterConfig {
  column: string;
  value: string | number | boolean;
  operator?: "eq" | "neq" | "gt" | "lt" | "gte" | "lte" | "like" | "ilike";
}

export interface TableState {
  page: number;
  limit: number;
  sort?: SortConfig;
  filters?: FilterConfig[];
  search?: string;
}
