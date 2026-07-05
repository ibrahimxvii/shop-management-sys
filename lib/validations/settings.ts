import { z } from "zod";

export const shopSettingsSchema = z.object({
  shop_name: z.string().min(1, "Shop name is required").max(100),
  shop_email: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
  shop_phone: z.string().max(30).optional().or(z.literal("")),
  shop_address: z.string().max(255).optional().or(z.literal("")),
  shop_city: z.string().max(100).optional().or(z.literal("")),
  shop_country: z
    .string()
    .min(2, "Use 2-letter country code")
    .max(2, "Use 2-letter country code")
    .default("US"),
  shop_logo_url: z.string().optional().or(z.literal("")),
  shop_logo_path: z.string().optional().or(z.literal("")),
  currency: z.string().min(1, "Currency is required").max(10).default("PKR"),
  currency_symbol: z
    .string()
    .min(1, "Currency symbol is required")
    .max(5)
    .default("Rs"),
  timezone: z.string().min(1, "Timezone is required").default("UTC"),
  date_format: z.string().min(1, "Date format is required").default("MM/DD/YYYY"),
  language: z.string().min(2).max(10).default("en"),
  tax_percentage: z.coerce
    .number()
    .min(0, "Tax cannot be negative")
    .max(100, "Tax cannot exceed 100%")
    .default(0),
  default_low_stock_limit: z.coerce
    .number()
    .int("Must be a whole number")
    .min(0, "Cannot be negative")
    .max(9999)
    .default(10),
});

export type ShopSettingsValues = z.infer<typeof shopSettingsSchema>;
export type ShopSettingsInput = z.input<typeof shopSettingsSchema>;

export const userPreferencesSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).default("system"),
  sidebar_collapsed: z.boolean().default(false),
  dashboard_default_view: z
    .enum(["overview", "sales", "inventory", "orders"])
    .default("overview"),
  items_per_page: z
    .union([z.literal(10), z.literal(25), z.literal(50), z.literal(100)])
    .default(10),
});

export type UserPreferencesValues = z.infer<typeof userPreferencesSchema>;
export type UserPreferencesInput = z.input<typeof userPreferencesSchema>;

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password too long"),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
