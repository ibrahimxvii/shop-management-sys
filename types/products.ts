export type ProductStatus = "active" | "inactive" | "draft";

export type EntityStatus = "active" | "inactive";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  image_url: string | null;
  image_path: string | null;
  status: EntityStatus;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  logo_path: string | null;
  status: EntityStatus;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  path: string;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  barcode: string | null;
  category_id: string | null;
  brand_id: string | null;
  purchase_price: number;
  selling_price: number;
  quantity: number;
  low_stock_limit: number;
  status: ProductStatus;
  is_featured: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ProductWithRelations extends Product {
  category: Category | null;
  brand: Brand | null;
  images: ProductImage[];
}

export interface ProductFilters {
  search?: string;
  status?: ProductStatus | "all";
  category_id?: string | "all";
  brand_id?: string | "all";
  featured?: boolean;
  low_stock?: boolean;
  /** Optional server-side pagination — omit to fetch all matching rows (legacy behavior). */
  limit?: number;
  offset?: number;
}

export interface PaginatedProducts {
  data: ProductWithRelations[];
  total: number;
}

export interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  featuredCount: number;
  totalInventoryValue: number;
  totalCustomers: number;
  totalCategories: number;
  totalBrands: number;
  recentProducts: ProductWithRelations[];
  lowStockProducts: Product[];
  productsByStatus: { status: string; count: number }[];
  dailyProducts: { date: string; count: number }[];
  recentInventoryActivity: Array<{
    id: string;
    action: string;
    quantity_change: number;
    updated_quantity: number;
    created_at: string;
    product: { id: string; name: string; sku: string | null } | null;
  }>;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  recentOrders: Array<{
    id: string;
    order_number: string;
    status: string;
    payment_status: string;
    grand_total: number;
    created_at: string;
    customer: { id: string; full_name: string; email: string | null } | null;
    items: Array<{ id: string; quantity: number; total_price: number }>;
  }>;
}
