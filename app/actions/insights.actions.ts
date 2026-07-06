"use server";

import { insightsService } from "@/services/insights.service";
import { parseError } from "@/lib/errors";

export async function getInsightsAction() {
  try {
    const data = await insightsService.getInsights();
    return { success: true, data, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

export async function getFrequentlyBoughtTogetherAction(productId: string, limit?: number) {
  try {
    const data = await insightsService.getFrequentlyBoughtTogether(productId, limit);
    return { success: true, data, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}
