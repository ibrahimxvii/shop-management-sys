import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { settingsService } from "@/services/settings.service";
import { ShopSettingsForm } from "@/components/settings/shop-settings-form";

export const metadata: Metadata = { title: "Shop Settings" };

export default async function ShopSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/settings/system");
  }

  const settings = await settingsService.getSettings().catch(() => null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Shop Configuration</h2>
        <p className="text-sm text-muted-foreground">
          Configure your store&apos;s information and regional settings
        </p>
      </div>
      <ShopSettingsForm initialData={settings} />
    </div>
  );
}
