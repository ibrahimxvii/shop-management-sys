import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { securityService } from "@/services/security.service";
import { SecuritySettings } from "@/components/settings/security-settings";

export const metadata: Metadata = { title: "Security" };

export default async function SecuritySettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const loginHistory = await securityService
    .getLoginHistory(user.id, 10)
    .catch(() => []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Security</h2>
        <p className="text-sm text-muted-foreground">
          Manage your account security, active sessions, and login history
        </p>
      </div>
      <SecuritySettings profile={profile} loginHistory={loginHistory} />
    </div>
  );
}
