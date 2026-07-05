"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Store, Globe, DollarSign, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { SingleImageUploader } from "@/components/ui/single-image-uploader";
import {
  shopSettingsSchema,
  type ShopSettingsValues,
  type ShopSettingsInput,
} from "@/lib/validations/settings";
import { updateSettingsAction } from "@/app/actions/settings.actions";
import type { ShopSettings } from "@/types/settings";

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Moscow",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Sydney",
  "Pacific/Auckland",
  "Pacific/Honolulu",
];

const DATE_FORMATS = [
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY (01/31/2025)" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY (31/01/2025)" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD (2025-01-31)" },
  { value: "DD.MM.YYYY", label: "DD.MM.YYYY (31.01.2025)" },
  { value: "MMM DD, YYYY", label: "MMM DD, YYYY (Jan 31, 2025)" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "es", label: "Spanish" },
  { value: "pt", label: "Portuguese" },
  { value: "ar", label: "Arabic" },
  { value: "zh", label: "Chinese (Simplified)" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "ru", label: "Russian" },
];

const SELECT_CLASS =
  "flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

interface ShopSettingsFormProps {
  initialData: ShopSettings | null;
}

export function ShopSettingsForm({ initialData }: ShopSettingsFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ShopSettingsInput, unknown, ShopSettingsValues>({
    resolver: zodResolver(shopSettingsSchema),
    defaultValues: {
      shop_name: initialData?.shop_name ?? "ShopFlow",
      shop_email: initialData?.shop_email ?? "",
      shop_phone: initialData?.shop_phone ?? "",
      shop_address: initialData?.shop_address ?? "",
      shop_city: initialData?.shop_city ?? "",
      shop_country: initialData?.shop_country ?? "US",
      shop_logo_url: initialData?.shop_logo_url ?? "",
      shop_logo_path: initialData?.shop_logo_path ?? "",
      currency: initialData?.currency ?? "PKR",
      currency_symbol: initialData?.currency_symbol ?? "Rs",
      timezone: initialData?.timezone ?? "UTC",
      date_format: initialData?.date_format ?? "MM/DD/YYYY",
      language: initialData?.language ?? "en",
      tax_percentage: initialData?.tax_percentage ?? 0,
      default_low_stock_limit: initialData?.default_low_stock_limit ?? 10,
    },
  });

  const logoUrl = watch("shop_logo_url");
  const logoPath = watch("shop_logo_path");

  const onSubmit = async (values: ShopSettingsValues) => {
    const result = await updateSettingsAction(values);
    if (!result.success) {
      toast.error(result.error ?? "Failed to save settings");
      return;
    }
    toast.success("Settings saved successfully");
  };

  const fieldError = (name: keyof typeof errors) =>
    errors[name]?.message ? (
      <p className="text-xs text-destructive">{errors[name]!.message as string}</p>
    ) : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Tabs defaultValue="general">
        <TabsList className="mb-6 flex-wrap h-auto gap-0">
          <TabsTrigger value="general" className="gap-2">
            <Store className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="regional" className="gap-2">
            <Globe className="h-4 w-4" />
            Regional
          </TabsTrigger>
          <TabsTrigger value="financial" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Financial
          </TabsTrigger>
          <TabsTrigger value="inventory" className="gap-2">
            <Package className="h-4 w-4" />
            Inventory
          </TabsTrigger>
        </TabsList>

        {/* ── General ── */}
        <TabsContent value="general">
          <div className="rounded-xl border bg-card p-6 shadow-card space-y-5">
            <div>
              <h3 className="font-medium">Store Information</h3>
              <p className="text-sm text-muted-foreground">
                Basic information about your store
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Shop Logo</Label>
              <SingleImageUploader
                bucket="shop-assets"
                folder="logos"
                value={
                  logoUrl ? { url: logoUrl, path: logoPath ?? "" } : null
                }
                onChange={(img) => {
                  setValue("shop_logo_url", img?.url ?? "", {
                    shouldDirty: true,
                  });
                  setValue("shop_logo_path", img?.path ?? "", {
                    shouldDirty: true,
                  });
                }}
                label="logo"
                className="max-w-xs"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="shop_name">Shop Name *</Label>
                <Input
                  id="shop_name"
                  {...register("shop_name")}
                  placeholder="ShopFlow"
                />
                {fieldError("shop_name")}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="shop_email">Shop Email</Label>
                <Input
                  id="shop_email"
                  type="email"
                  {...register("shop_email")}
                  placeholder="contact@shop.com"
                />
                {fieldError("shop_email")}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="shop_phone">Phone Number</Label>
                <Input
                  id="shop_phone"
                  {...register("shop_phone")}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="shop_country">
                  Country Code{" "}
                  <span className="text-muted-foreground font-normal text-xs">
                    (2-letter, e.g. US)
                  </span>
                </Label>
                <Input
                  id="shop_country"
                  {...register("shop_country")}
                  placeholder="US"
                  maxLength={2}
                  className="uppercase"
                />
                {fieldError("shop_country")}
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="shop_address">Address</Label>
                <Input
                  id="shop_address"
                  {...register("shop_address")}
                  placeholder="123 Main Street"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="shop_city">City</Label>
                <Input
                  id="shop_city"
                  {...register("shop_city")}
                  placeholder="New York"
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Regional ── */}
        <TabsContent value="regional">
          <div className="rounded-xl border bg-card p-6 shadow-card space-y-5">
            <div>
              <h3 className="font-medium">Regional Settings</h3>
              <p className="text-sm text-muted-foreground">
                Timezone, date format and language preferences
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="timezone">Timezone</Label>
                <select id="timezone" {...register("timezone")} className={SELECT_CLASS}>
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="date_format">Date Format</Label>
                <select
                  id="date_format"
                  {...register("date_format")}
                  className={SELECT_CLASS}
                >
                  {DATE_FORMATS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="language">Language</Label>
                <select
                  id="language"
                  {...register("language")}
                  className={SELECT_CLASS}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Financial ── */}
        <TabsContent value="financial">
          <div className="rounded-xl border bg-card p-6 shadow-card space-y-5">
            <div>
              <h3 className="font-medium">Financial Settings</h3>
              <p className="text-sm text-muted-foreground">
                Currency and tax configuration
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="currency">Currency Code</Label>
                <Input
                  id="currency"
                  {...register("currency")}
                  placeholder="PKR"
                  maxLength={10}
                />
                {fieldError("currency")}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="currency_symbol">Currency Symbol</Label>
                <Input
                  id="currency_symbol"
                  {...register("currency_symbol")}
                  placeholder="Rs"
                  maxLength={5}
                />
                {fieldError("currency_symbol")}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tax_percentage">Tax Percentage (%)</Label>
                <Input
                  id="tax_percentage"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  {...register("tax_percentage")}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">
                  Applied to taxable orders and invoices
                </p>
                {fieldError("tax_percentage")}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Inventory ── */}
        <TabsContent value="inventory">
          <div className="rounded-xl border bg-card p-6 shadow-card space-y-5">
            <div>
              <h3 className="font-medium">Inventory Defaults</h3>
              <p className="text-sm text-muted-foreground">
                Default thresholds for inventory management
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="default_low_stock_limit">
                  Default Low Stock Limit
                </Label>
                <Input
                  id="default_low_stock_limit"
                  type="number"
                  min="0"
                  max="9999"
                  {...register("default_low_stock_limit")}
                  placeholder="10"
                />
                <p className="text-xs text-muted-foreground">
                  Products at or below this quantity are flagged as low stock
                </p>
                {fieldError("default_low_stock_limit")}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex justify-end">
        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </form>
  );
}

export function ShopSettingsFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-2 h-9">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-lg" />
        ))}
      </div>
      <div className="rounded-xl border bg-card p-6 space-y-5">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
