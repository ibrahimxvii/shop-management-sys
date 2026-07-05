"use server";

import { searchService } from "@/services/search.service";
import { parseError } from "@/lib/errors";

export async function globalSearchAction(query: string) {
  if (query.trim().length < 2) {
    return { success: true, data: { products: [], orders: [], customers: [] }, error: null };
  }
  try {
    const results = await searchService.globalSearch(query.trim());
    return { success: true, data: results, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}
