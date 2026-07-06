"use client";

import { useQuery } from "@tanstack/react-query";
import { getInsightsAction, getFrequentlyBoughtTogetherAction } from "@/app/actions/insights.actions";

const KEYS = {
  all: ["insights"] as const,
  detail: () => ["insights", "detail"] as const,
  frequentlyBoughtTogether: (productId: string) => ["insights", "fbt", productId] as const,
};

export function useInsights() {
  return useQuery({
    queryKey: KEYS.detail(),
    queryFn: async () => {
      const result = await getInsightsAction();
      if (!result.success) throw new Error(result.error ?? "Failed to load insights");
      return result.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useFrequentlyBoughtTogether(productId: string | null) {
  return useQuery({
    queryKey: KEYS.frequentlyBoughtTogether(productId ?? ""),
    queryFn: async () => {
      if (!productId) return [];
      const result = await getFrequentlyBoughtTogetherAction(productId);
      if (!result.success) throw new Error(result.error ?? "Failed to load related products");
      return result.data ?? [];
    },
    enabled: !!productId,
    staleTime: 60 * 1000,
  });
}
