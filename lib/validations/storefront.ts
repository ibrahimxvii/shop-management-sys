import { z } from "zod";

export const storefrontCheckoutItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1),
});

export const storefrontCheckoutSchema = z.object({
  clientReferenceId: z.string().uuid(),
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(7, "Enter a valid phone number"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  notes: z.string().max(500).optional(),
  items: z.array(storefrontCheckoutItemSchema).min(1, "Your cart is empty"),
});

export type StorefrontCheckoutFormValues = z.infer<typeof storefrontCheckoutSchema>;

/**
 * Client-form-only variant (no `items`) — the cart's item list lives in
 * Zustand, not in a form field, so validating it here would always fail
 * since nothing in the form updates it. The full storefrontCheckoutSchema
 * (with items) still runs server-side in createStorefrontOrderAction.
 */
export const storefrontCheckoutFormSchema = storefrontCheckoutSchema.omit({ items: true });
export type StorefrontCheckoutFormOnlyValues = z.infer<typeof storefrontCheckoutFormSchema>;

export const storefrontTrackOrderSchema = z.object({
  orderNumber: z.string().min(1, "Order number is required"),
  phone: z.string().min(7, "Enter a valid phone number"),
});

export type StorefrontTrackOrderValues = z.infer<typeof storefrontTrackOrderSchema>;
