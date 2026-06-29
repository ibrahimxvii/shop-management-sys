"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  userPreferencesSchema,
  type UserPreferencesValues,
  type UserPreferencesInput,
} from "@/lib/validations/settings";
import { updateUserPreferencesAction } from "@/app/actions/settings.actions";
import type { UserPreferences } from "@/types/settings";

const THEME_OPTIONS = [
  { value: "light" as const, label: "Light", icon: Sun },
  { value: "dark" as const, label: "Dark", icon: Moon },
  { value: "system" as const, label: "System", icon: Monitor },
];

const VIEW_OPTIONS = [
  { value: "overview" as const, label: "Overview" },
  { value: "sales" as const, label: "Sales" },
  { value: "inventory" as const, label: "Inventory" },
  { value: "orders" as const, label: "Orders" },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

interface SystemSettingsFormProps {
  initialData: UserPreferences | null;
}

export function SystemSettingsForm({ initialData }: SystemSettingsFormProps) {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting, isDirty },
  } = useForm<UserPreferencesInput, unknown, UserPreferencesValues>({
    resolver: zodResolver(userPreferencesSchema),
    defaultValues: {
      theme: initialData?.theme ?? "system",
      sidebar_collapsed: initialData?.sidebar_collapsed ?? false,
      dashboard_default_view: initialData?.dashboard_default_view ?? "overview",
      items_per_page: initialData?.items_per_page ?? 10,
    },
  });

  const onSubmit = async (values: UserPreferencesValues) => {
    const result = await updateUserPreferencesAction(values);
    if (!result.success) {
      toast.error(result.error ?? "Failed to save preferences");
      return;
    }
    toast.success("Preferences saved");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Theme */}
      <div className="rounded-xl border bg-card p-6 shadow-card space-y-4">
        <div>
          <h3 className="font-medium">Appearance</h3>
          <p className="text-sm text-muted-foreground">
            Choose your preferred color theme
          </p>
        </div>

        <Controller
          control={control}
          name="theme"
          render={({ field }) => (
            <div className="flex gap-3">
              {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => field.onChange(value)}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-2 rounded-xl border-2 p-4 cursor-pointer transition-all",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    field.value === value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
                  )}
                  aria-pressed={field.value === value}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      field.value === value
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm font-medium",
                      field.value === value
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    {label}
                  </span>
                </button>
              ))}
            </div>
          )}
        />
      </div>

      {/* Sidebar */}
      <div className="rounded-xl border bg-card p-6 shadow-card space-y-4">
        <div>
          <h3 className="font-medium">Sidebar</h3>
          <p className="text-sm text-muted-foreground">
            Control the default sidebar state on page load
          </p>
        </div>

        <Controller
          control={control}
          name="sidebar_collapsed"
          render={({ field }) => (
            <div className="flex items-center justify-between rounded-lg border border-border/60 p-4">
              <div>
                <Label htmlFor="sidebar_collapsed" className="cursor-pointer">
                  Start collapsed
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sidebar opens in collapsed icon-only state by default
                </p>
              </div>
              <Switch
                id="sidebar_collapsed"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </div>
          )}
        />
      </div>

      {/* Dashboard default view */}
      <div className="rounded-xl border bg-card p-6 shadow-card space-y-4">
        <div>
          <h3 className="font-medium">Dashboard Default View</h3>
          <p className="text-sm text-muted-foreground">
            Which section to highlight first when opening the dashboard
          </p>
        </div>

        <Controller
          control={control}
          name="dashboard_default_view"
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {VIEW_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => field.onChange(value)}
                  className={cn(
                    "rounded-lg border px-4 py-2 text-sm transition-all cursor-pointer",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    field.value === value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-muted-foreground/40 hover:bg-muted/30"
                  )}
                  aria-pressed={field.value === value}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        />
      </div>

      {/* Pagination */}
      <div className="rounded-xl border bg-card p-6 shadow-card space-y-4">
        <div>
          <h3 className="font-medium">Pagination</h3>
          <p className="text-sm text-muted-foreground">
            Default number of items shown per page in data tables
          </p>
        </div>

        <Controller
          control={control}
          name="items_per_page"
          render={({ field }) => (
            <div className="flex gap-2">
              {PAGE_SIZE_OPTIONS.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => field.onChange(size)}
                  className={cn(
                    "rounded-lg border px-4 py-2 text-sm transition-all cursor-pointer",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    field.value === size
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-muted-foreground/40 hover:bg-muted/30"
                  )}
                  aria-pressed={field.value === size}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting ? "Saving..." : "Save Preferences"}
        </Button>
      </div>
    </form>
  );
}
