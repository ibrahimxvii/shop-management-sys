import { createClient } from "@/lib/supabase/server";
import type {
  ActivityLog,
  ActivityAction,
  ActivityResource,
  ActivityLogFilters,
} from "@/types/settings";

interface LogParams {
  userId: string;
  userName: string;
  action: ActivityAction;
  resource: ActivityResource;
  resourceId?: string;
  description: string;
  metadata?: Record<string, unknown>;
}

export const activityLogService = {
  async log(params: LogParams): Promise<void> {
    const supabase = await createClient();
    await supabase.from("activity_logs").insert({
      user_id: params.userId,
      user_name: params.userName,
      action: params.action,
      resource: params.resource,
      resource_id: params.resourceId ?? null,
      description: params.description,
      metadata: params.metadata ?? {},
    });
  },

  async getLogs(
    filters: ActivityLogFilters = {}
  ): Promise<{ data: ActivityLog[]; total: number }> {
    const supabase = await createClient();
    const { page = 1, limit = 25, search, action, resource, from, to } =
      filters;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("activity_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(
        `description.ilike.%${search}%,user_name.ilike.%${search}%`
      );
    }
    if (action) query = query.eq("action", action);
    if (resource) query = query.eq("resource", resource);
    if (from) query = query.gte("created_at", from);
    if (to) query = query.lte("created_at", to);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);
    return { data: (data ?? []) as ActivityLog[], total: count ?? 0 };
  },
};
