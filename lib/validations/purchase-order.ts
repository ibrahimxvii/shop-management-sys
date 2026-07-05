import { z } from "zod";

export const purchaseOrderItemSchema = z.object({
  product_id: z.string().min(1, "Select a product"),
  product_name: z.string().optional(),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  unit_cost: z.number().min(0, "Cost cannot be negative"),
});

export type PurchaseOrderItemFormValues = z.infer<typeof purchaseOrderItemSchema>;

export const purchaseOrderSchema = z.object({
  supplier_id: z.string().min(1, "Select a supplier"),
  items: z.array(purchaseOrderItemSchema).min(1, "At least one product is required"),
  notes: z.string().max(1000).optional(),
});

export type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>;
export type PurchaseOrderFormInput = z.input<typeof purchaseOrderSchema>;
