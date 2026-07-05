import { z } from "zod";

export const supplierSchema = z.object({
  name: z.string().min(1, "Name is required").max(150, "Name too long"),
  contact_name: z.string().max(150).optional().or(z.literal("")),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
  address: z.string().max(255).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  country: z.string().default("PK"),
  notes: z.string().max(1000).optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]).default("active"),
});

export type SupplierFormValues = z.infer<typeof supplierSchema>;
export type SupplierFormInput = z.input<typeof supplierSchema>;
