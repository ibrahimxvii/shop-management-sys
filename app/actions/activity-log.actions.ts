"use server";

import { createClient } from "@/lib/supabase/server";
import { activityLogService } from "@/services/activity-log.service";
import { parseError } from "@/lib/errors";
import type { ActivityAction, ActivityResource, ActivityLogFilters } from "@/types/settings";

export async function getActivityLogsAction(filters: ActivityLogFilters = {}) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, data: null, total: 0, error: "Not authenticated" };
    }

    const result = await activityLogService.getLogs(filters);
    return { success: true, data: result.data, total: result.total, error: null };
  } catch (e) {
    return { success: false, data: null, total: 0, error: parseError(e) };
  }
}

export async function logActivityAction(params: {
  action: ActivityAction;
  resource: ActivityResource;
  resourceId?: string;
  description: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false };

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    await activityLogService.log({
      userId: user.id,
      userName: profile?.full_name ?? user.email ?? "Unknown",
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      description: params.description,
      metadata: params.metadata,
    });

    return { success: true };
  } catch {
    return { success: false };
  }
}
