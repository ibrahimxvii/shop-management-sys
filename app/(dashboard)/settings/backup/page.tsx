import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BackupPanel } from "@/components/settings/backup-panel";

export const metadata: Metadata = { title: "Backup & Restore" };

export default async function BackupPage() {
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Backup & Restore</h2>
        <p className="text-sm text-muted-foreground">
          Manage your data backups and system data exports
        </p>
      </div>
      <BackupPanel />
    </div>
  );
}
