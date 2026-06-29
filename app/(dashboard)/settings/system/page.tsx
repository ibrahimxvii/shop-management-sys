import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { userPreferencesService } from "@/services/user-preferences.service";
import { SystemSettingsForm } from "@/components/settings/system-settings-form";

export const metadata: Metadata = { title: "System Settings" };

export default async function SystemSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const preferences = await userPreferencesService
    .getPreferences(user.id)
    .catch(() => null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">System Preferences</h2>
        <p className="text-sm text-muted-foreground">
          Customize your interface appearance and behavior
        </p>
      </div>
      <SystemSettingsForm initialData={preferences} />
    </div>
  );
}
