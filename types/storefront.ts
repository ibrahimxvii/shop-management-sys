export interface StorefrontProduct {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  selling_price: number;
  quantity: number;
  low_stock_limit: number;
  is_featured: boolean;
  created_at: string;
  category: { id: string; name: string; slug: string } | null;
  brand: { id: string; name: string; slug: string } | null;
  images: { url: string; is_primary: boolean }[];
}

export interface StorefrontCategory {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
}

export interface StorefrontBrand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

export interface StorefrontProductFilters {
  search?: string;
  categoryId?: string;
  brandId?: string;
  limit?: number;
  offset?: number;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
  maxQuantity: number;
}

export interface StorefrontCheckoutInput {
  clientReferenceId: string;
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  notes?: string;
  items: { productId: string; quantity: number }[];
}

export interface StorefrontOrderResult {
  orderId: string;
  orderNumber: string;
}

export interface StorefrontOrderStatus {
  order_number: string;
  status: string;
  payment_status: string;
  grand_total: number;
  created_at: string;
  items: { product_name: string; quantity: number; unit_price: number; total_price: number }[] | null;
}
