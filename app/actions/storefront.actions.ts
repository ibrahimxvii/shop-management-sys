"use server";

import { storefrontService } from "@/services/storefront.service";
import { parseError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { storefrontCheckoutSchema, storefrontTrackOrderSchema } from "@/lib/validations/storefront";
import type { StorefrontProductFilters } from "@/types/storefront";

export async function getStorefrontProductsAction(filters?: StorefrontProductFilters) {
  try {
    const data = await storefrontService.getProducts(filters);
    return { success: true, data, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

export async function getStorefrontProductByIdAction(id: string) {
  try {
    const data = await storefrontService.getProductById(id);
    return { success: true, data, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

export async function getStorefrontCategoriesAction() {
  try {
    const data = await storefrontService.getCategories();
    return { success: true, data, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

export async function getStorefrontBrandsAction() {
  try {
    const data = await storefrontService.getBrands();
    return { success: true, data, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

export async function getStorefrontRelatedProductsAction(productId: string, categoryId: string | null) {
  try {
    const data = await storefrontService.getRelatedProducts(productId, categoryId);
    return { success: true, data, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

export async function createStorefrontOrderAction(values: unknown) {
  const validated = storefrontCheckoutSchema.safeParse(values);
  if (!validated.success) {
    return { success: false, data: null, error: validated.error.errors[0].message };
  }

  try {
    const data = await storefrontService.checkout({
      clientReferenceId: validated.data.clientReferenceId,
      fullName: validated.data.fullName,
      phone: validated.data.phone,
      email: validated.data.email || undefined,
      address: validated.data.address,
      city: validated.data.city,
      notes: validated.data.notes,
      items: validated.data.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    });
    return { success: true, data, error: null };
  } catch (error) {
    const message = parseError(error);
    logger.error("[storefront checkout] failed", { message });
    return { success: false, data: null, error: message };
  }
}

export async function trackStorefrontOrderAction(values: unknown) {
  const validated = storefrontTrackOrderSchema.safeParse(values);
  if (!validated.success) {
    return { success: false, data: null, error: validated.error.errors[0].message };
  }

  try {
    const data = await storefrontService.trackOrder(validated.data.orderNumber, validated.data.phone);
    if (!data) {
      return { success: false, data: null, error: "No matching order found. Check your order number and phone." };
    }
    return { success: true, data, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}
