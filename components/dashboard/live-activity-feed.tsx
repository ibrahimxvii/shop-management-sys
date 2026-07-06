"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getActivityLogsAction } from "@/app/actions/activity-log.actions";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/utils";
import type { Database } from "@/types/database";

type ActivityLogRow = Database["public"]["Tables"]["activity_logs"]["Row"];

const QUERY_KEY = ["activity-logs", "live-feed"] as const;
const FEED_LIMIT = 10;

/** Admin/manager only — activity_logs RLS restricts SELECT to those roles. */
export function LiveActivityFeed() {
  const { isManager } = useAuth();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const result = await getActivityLogsAction({ limit: FEED_LIMIT });
      if (!result.success) throw new Error(result.error ?? "Failed to load activity");
      return result.data ?? [];
    },
    enabled: isManager,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (!isManager) return;

    const supabase = createClient();
    const channel = supabase
      .channel("realtime-activity-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activity_logs" },
        () => {
          queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isManager, queryClient]);

  if (!isManager) return null;

  const logs = (data ?? []) as ActivityLogRow[];

  return (
    <Card variant="elevated" padding="default">
      <CardHeader>
        <CardTitle>Live Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No recent activity.</p>
        ) : (
          <ul className="space-y-3">
            {logs.map((log) => (
              <li key={log.id} className="flex items-start gap-2 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <div className="min-w-0">
                  <p className="truncate">
                    <span className="font-medium">{log.user_name ?? "System"}</span>{" "}
                    <span className="text-muted-foreground">{log.description}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(log.created_at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
