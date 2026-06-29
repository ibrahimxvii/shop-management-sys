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
          image_url: string | null;
          image_path: string | null;
          status: "active" | "inactive";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          parent_id?: string | null;
          image_url?: string | null;
          image_path?: string | null;
          status?: "active" | "inactive";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          parent_id?: string | null;
          image_url?: string | null;
          image_path?: string | null;
          status?: "active" | "inactive";
          updated_at?: string;
        };
        Relationships: [];
      };
      brands: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          logo_url: string | null;
          logo_path: string | null;
          status: "active" | "inactive";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          logo_url?: string | null;
          logo_path?: string | null;
          status?: "active" | "inactive";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          logo_url?: string | null;
          logo_path?: string | null;
          status?: "active" | "inactive";
          updated_at?: string;
        };
        Relationships: [];
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
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_brand_id_fkey";
            columns: ["brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [];
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
          user_id: string | null;
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
          user_id?: string | null;
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
          user_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      customers: {
        Row: {
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
        };
        Insert: {
          id?: string;
          full_name: string;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          country?: string;
          postal_code?: string | null;
          notes?: string | null;
          status?: "active" | "inactive";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          country?: string;
          postal_code?: string | null;
          notes?: string | null;
          status?: "active" | "inactive";
          updated_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_id: string | null;
          status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
          payment_method: "cash" | "card" | "bank_transfer" | "online";
          payment_status: "unpaid" | "partial" | "paid" | "refunded";
          subtotal: number;
          discount_amount: number;
          tax_amount: number;
          shipping_amount: number;
          grand_total: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number?: string;
          customer_id?: string | null;
          status?: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
          payment_method?: "cash" | "card" | "bank_transfer" | "online";
          payment_status?: "unpaid" | "partial" | "paid" | "refunded";
          subtotal?: number;
          discount_amount?: number;
          tax_amount?: number;
          shipping_amount?: number;
          grand_total?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_number?: string;
          customer_id?: string | null;
          status?: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
          payment_method?: "cash" | "card" | "bank_transfer" | "online";
          payment_status?: "unpaid" | "partial" | "paid" | "refunded";
          subtotal?: number;
          discount_amount?: number;
          tax_amount?: number;
          shipping_amount?: number;
          grand_total?: number;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          discount_percent: number;
          total_price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          quantity?: number;
          unit_price: number;
          discount_percent?: number;
          total_price: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          quantity?: number;
          unit_price?: number;
          discount_percent?: number;
          total_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          amount: number;
          payment_method: string;
          payment_date: string;
          transaction_id: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          amount: number;
          payment_method: string;
          payment_date?: string;
          transaction_id?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          amount?: number;
          payment_method?: string;
          payment_date?: string;
          transaction_id?: string | null;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory_history: {
        Row: {
          id: string;
          product_id: string;
          user_id: string;
          action: "stock_in" | "stock_out" | "adjustment" | "initial";
          previous_quantity: number;
          updated_quantity: number;
          quantity_change: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          user_id: string;
          action: "stock_in" | "stock_out" | "adjustment" | "initial";
          previous_quantity?: number;
          updated_quantity?: number;
          quantity_change?: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          user_id?: string;
          action?: "stock_in" | "stock_out" | "adjustment" | "initial";
          previous_quantity?: number;
          updated_quantity?: number;
          quantity_change?: number;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_history_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_history_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: "low_stock" | "new_order" | "cancelled_order" | "refund_request" | "system";
          title: string;
          message: string;
          read: boolean;
          related_id: string | null;
          related_type: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: "low_stock" | "new_order" | "cancelled_order" | "refund_request" | "system";
          title: string;
          message: string;
          read?: boolean;
          related_id?: string | null;
          related_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: "low_stock" | "new_order" | "cancelled_order" | "refund_request" | "system";
          title?: string;
          message?: string;
          read?: boolean;
          related_id?: string | null;
          related_type?: string | null;
          updated_at?: string;
        };
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_order_stats: { Args: Record<string, never>; Returns: Json };
      get_monthly_revenue: { Args: { months_back: number }; Returns: Json };
      get_weekly_sales: { Args: { weeks_back: number }; Returns: Json };
      get_best_selling_products: { Args: { p_limit: number }; Returns: Json };
      get_top_categories: { Args: { p_limit: number }; Returns: Json };
      get_top_customers: { Args: { p_limit: number }; Returns: Json };
      get_inventory_stats: { Args: Record<string, never>; Returns: Json };
      get_sales_report: {
        Args: { p_from: string; p_to: string; p_group_by: string };
        Returns: Json;
      };
      create_order_transaction: { Args: Record<string, unknown>; Returns: Json };
      update_order_transaction: { Args: Record<string, unknown>; Returns: Json };
      cancel_order_transaction: { Args: Record<string, unknown>; Returns: Json };
    };
    Enums: {
      user_role: "admin" | "manager" | "staff";
      product_status: "active" | "inactive" | "draft";
    };
  };
}
