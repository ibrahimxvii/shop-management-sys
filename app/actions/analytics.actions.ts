"use server";

import { analyticsService } from "@/services/analytics.service";
import { parseError } from "@/lib/errors";

export async function getAnalyticsAction() {
  try {
    const data = await analyticsService.getAnalytics();
    return { success: true, data, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}
