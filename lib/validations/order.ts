import { z } from "zod";

export const customerSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default("US"),
  postal_code: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;

export const orderItemSchema = z.object({
  product_id: z.string().min(1, "Select a product"),
  product_name: z.string().optional(),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  unit_price: z.number().min(0, "Price cannot be negative"),
  discount_percent: z.number().min(0).max(100).default(0),
});

export type OrderItemFormValues = z.infer<typeof orderItemSchema>;

export const orderSchema = z.object({
  customer_id: z.string().optional(),
  items: z
    .array(orderItemSchema)
    .min(1, "At least one product is required"),
  discount_amount: z.number().min(0).default(0),
  tax_amount: z.number().min(0).default(0),
  shipping_amount: z.number().min(0).default(0),
  payment_method: z.enum(["cash", "card", "bank_transfer", "online"]),
  payment_status: z.enum(["unpaid", "partial", "paid", "refunded"]),
  status: z
    .enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"])
    .default("pending"),
  notes: z.string().optional(),
});

export type OrderFormValues = z.infer<typeof orderSchema>;

export const updateOrderStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"]),
});
