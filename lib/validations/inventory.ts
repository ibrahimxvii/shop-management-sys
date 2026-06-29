import { z } from "zod";

export const stockMovementSchema = z.object({
  product_id: z.string().uuid("Invalid product"),
  action: z.enum(["stock_in", "stock_out", "adjustment", "initial"]),
  quantity: z.coerce
    .number()
    .int("Quantity must be a whole number")
    .positive("Quantity must be greater than 0"),
  notes: z.string().max(500, "Notes too long").optional().or(z.literal("")),
});

export type StockMovementFormValues = z.infer<typeof stockMovementSchema>;

export const adjustStockSchema = z.object({
  product_id: z.string().uuid("Invalid product"),
  new_quantity: z.coerce
    .number()
    .int("Quantity must be a whole number")
    .min(0, "Quantity cannot be negative"),
  notes: z.string().max(500, "Notes too long").optional().or(z.literal("")),
});

export type AdjustStockFormValues = z.infer<typeof adjustStockSchema>;
