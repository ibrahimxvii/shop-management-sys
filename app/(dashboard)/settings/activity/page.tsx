import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ActivityLogTable } from "@/components/settings/activity-log-table";

export const metadata: Metadata = { title: "Activity Logs" };

export default async function ActivityLogsPage() {
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

  if (!profile || !["admin", "manager"].includes(profile.role)) {
    redirect("/settings/system");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Activity Logs</h2>
        <p className="text-sm text-muted-foreground">
          Full audit trail of all user actions and system events
        </p>
      </div>
      <ActivityLogTable />
    </div>
  );
}
