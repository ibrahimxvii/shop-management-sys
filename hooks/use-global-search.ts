"use client";

import { useQuery } from "@tanstack/react-query";
import { globalSearchAction } from "@/app/actions/search.actions";

export function useGlobalSearch(query: string) {
  return useQuery({
    queryKey: ["global-search", query],
    queryFn: async () => {
      const result = await globalSearchAction(query);
      if (!result.success) throw new Error(result.error ?? "Search failed");
      return result.data;
    },
    enabled: query.trim().length >= 2,
    staleTime: 10 * 1000,
  });
}
