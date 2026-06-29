import { z } from "zod";

export const productSchema = z.object({
  name: z
    .string()
    .min(1, "Product name is required")
    .max(255, "Name must be under 255 characters"),
  description: z.string().max(5000, "Description too long").optional().or(z.literal("")),
  sku: z
    .string()
    .max(100, "SKU must be under 100 characters")
    .optional()
    .or(z.literal("")),
  barcode: z
    .string()
    .max(100, "Barcode must be under 100 characters")
    .optional()
    .or(z.literal("")),
  category_id: z.string().uuid("Invalid category").optional().or(z.literal("")),
  brand_id: z.string().uuid("Invalid brand").optional().or(z.literal("")),
  purchase_price: z.coerce
    .number()
    .min(0, "Purchase price must be 0 or greater")
    .max(999999999, "Price too large"),
  selling_price: z.coerce
    .number()
    .min(0, "Selling price must be 0 or greater")
    .max(999999999, "Price too large"),
  quantity: z.coerce
    .number()
    .int("Quantity must be a whole number")
    .min(0, "Quantity must be 0 or greater"),
  low_stock_limit: z.coerce
    .number()
    .int("Low stock limit must be a whole number")
    .min(0, "Must be 0 or greater"),
  status: z.enum(["active", "inactive", "draft"]),
  is_featured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});

export type ProductFormValues = z.infer<typeof productSchema>;

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100, "Slug too long")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only"),
  description: z.string().max(500).optional().or(z.literal("")),
  image_url: z.string().optional().or(z.literal("")),
  image_path: z.string().optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]).default("active"),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

export const brandSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100, "Slug too long")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only"),
  description: z.string().max(500).optional().or(z.literal("")),
  logo_url: z.string().optional().or(z.literal("")),
  logo_path: z.string().optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]).default("active"),
});

export type BrandFormValues = z.infer<typeof brandSchema>;

export const bulkStatusSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
  status: z.enum(["active", "inactive", "draft"]),
});

export type BulkStatusValues = z.infer<typeof bulkStatusSchema>;
