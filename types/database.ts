export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          parent_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          parent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          parent_id?: string | null;
          updated_at?: string;
        };
      };
      brands: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          logo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          logo_url?: string | null;
          updated_at?: string;
        };
      };
      products: {
        Row: {
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
          status: "active" | "inactive" | "draft";
          is_featured: boolean;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          sku?: string | null;
          barcode?: string | null;
          category_id?: string | null;
          brand_id?: string | null;
          purchase_price?: number;
          selling_price?: number;
          quantity?: number;
          low_stock_limit?: number;
          status?: "active" | "inactive" | "draft";
          is_featured?: boolean;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          sku?: string | null;
          barcode?: string | null;
          category_id?: string | null;
          brand_id?: string | null;
          purchase_price?: number;
          selling_price?: number;
          quantity?: number;
          low_stock_limit?: number;
          status?: "active" | "inactive" | "draft";
          is_featured?: boolean;
          tags?: string[];
          updated_at?: string;
        };
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          url: string;
          path: string;
          is_primary: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          url: string;
          path: string;
          is_primary?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          url?: string;
          path?: string;
          is_primary?: boolean;
          sort_order?: number;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: "admin" | "manager" | "staff";
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: "admin" | "manager" | "staff";
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: "admin" | "manager" | "staff";
          is_active?: boolean;
          updated_at?: string;
        };
      };
      employees: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string | null;
          avatar_url: string | null;
          avatar_path: string | null;
          role: "admin" | "manager" | "staff";
          status: "active" | "inactive" | "on_leave";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          email: string;
          phone?: string | null;
          avatar_url?: string | null;
          avatar_path?: string | null;
          role?: "admin" | "manager" | "staff";
          status?: "active" | "inactive" | "on_leave";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          phone?: string | null;
          avatar_url?: string | null;
          avatar_path?: string | null;
          role?: "admin" | "manager" | "staff";
          status?: "active" | "inactive" | "on_leave";
          updated_at?: string;
        };
      };
    };
      settings: {
        Row: {
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
        };
        Insert: {
          id?: string;
          shop_name?: string;
          shop_email?: string | null;
          shop_phone?: string | null;
          shop_address?: string | null;
          shop_city?: string | null;
          shop_country?: string;
          shop_logo_url?: string | null;
          shop_logo_path?: string | null;
          currency?: string;
          currency_symbol?: string;
          timezone?: string;
          date_format?: string;
          language?: string;
          tax_percentage?: number;
          default_low_stock_limit?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          shop_name?: string;
          shop_email?: string | null;
          shop_phone?: string | null;
          shop_address?: string | null;
          shop_city?: string | null;
          shop_country?: string;
          shop_logo_url?: string | null;
          shop_logo_path?: string | null;
          currency?: string;
          currency_symbol?: string;
          timezone?: string;
          date_format?: string;
          language?: string;
          tax_percentage?: number;
          default_low_stock_limit?: number;
          updated_at?: string;
        };
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          theme: "light" | "dark" | "system";
          sidebar_collapsed: boolean;
          dashboard_default_view: "overview" | "sales" | "inventory" | "orders";
          items_per_page: 10 | 25 | 50 | 100;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          theme?: "light" | "dark" | "system";
          sidebar_collapsed?: boolean;
          dashboard_default_view?: "overview" | "sales" | "inventory" | "orders";
          items_per_page?: 10 | 25 | 50 | 100;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          theme?: "light" | "dark" | "system";
          sidebar_collapsed?: boolean;
          dashboard_default_view?: "overview" | "sales" | "inventory" | "orders";
          items_per_page?: 10 | 25 | 50 | 100;
          updated_at?: string;
        };
      };
      activity_logs: {
        Row: {
          id: string;
          user_id: string | null;
          user_name: string | null;
          action: string;
          resource: string;
          resource_id: string | null;
          description: string;
          metadata: Record<string, unknown>;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          user_name?: string | null;
          action: string;
          resource: string;
          resource_id?: string | null;
          description: string;
          metadata?: Record<string, unknown>;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          description?: string;
          metadata?: Record<string, unknown>;
        };
      };
      login_history: {
        Row: {
          id: string;
          user_id: string;
          ip_address: string | null;
          user_agent: string | null;
          status: "success" | "failed";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          ip_address?: string | null;
          user_agent?: string | null;
          status?: "success" | "failed";
          created_at?: string;
        };
        Update: Record<string, never>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: "admin" | "manager" | "staff";
      product_status: "active" | "inactive" | "draft";
    };
  };
}
