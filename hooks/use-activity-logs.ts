import { useQuery } from "@tanstack/react-query";
import { getActivityLogsAction } from "@/app/actions/activity-log.actions";
import type { ActivityLogFilters } from "@/types/settings";

export function useActivityLogs(filters: ActivityLogFilters = {}) {
  return useQuery({
    queryKey: ["activity-logs", filters],
    queryFn: async () => {
      const result = await getActivityLogsAction(filters);
      if (!result.success) {
        throw new Error(result.error ?? "Failed to load activity logs");
      }
      return { data: result.data ?? [], total: result.total ?? 0 };
    },
  });
}
