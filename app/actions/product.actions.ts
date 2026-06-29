"use server";

import { revalidatePath } from "next/cache";
import { productService } from "@/services/product.service";
import { categoryService } from "@/services/category.service";
import { brandService } from "@/services/brand.service";
import {
  productSchema,
  categorySchema,
  brandSchema,
  bulkStatusSchema,
  type ProductFormValues,
} from "@/lib/validations/product";
import { parseError } from "@/lib/errors";
import type { ProductFilters } from "@/types/products";
import type { CategoryFilters } from "@/services/category.service";
import type { BrandFilters } from "@/services/brand.service";

// ============================================================
// Products
// ============================================================

export async function getProductsAction(filters?: ProductFilters) {
  try {
    const products = await productService.getProducts(filters);
    return { success: true, data: products, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

/**
 * Server-side paginated product listing. Prefer this over getProductsAction
 * for large catalogs — it returns only the requested page plus a total count
 * instead of every matching row.
 */
export async function getProductsPaginatedAction(
  filters: ProductFilters & { limit: number; offset: number }
) {
  try {
    const result = await productService.getProductsPaginated(filters);
    return { success: true, data: result.data, total: result.total, error: null };
  } catch (error) {
    return { success: false, data: null, total: 0, error: parseError(error) };
  }
}

export async function getProductByIdAction(id: string) {
  try {
    const product = await productService.getProductById(id);
    return { success: true, data: product, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

export async function createProductAction(
  values: ProductFormValues,
  images: { url: string; path: string; is_primary: boolean }[]
) {
  const validated = productSchema.safeParse(values);
  if (!validated.success) {
    return {
      success: false,
      data: null,
      error: validated.error.errors[0].message,
    };
  }

  try {
    const product = await productService.createProduct(validated.data, images);
    revalidatePath("/products");
    revalidatePath("/dashboard");
    return { success: true, data: product, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

export async function updateProductAction(
  id: string,
  values: ProductFormValues,
  images: { url: string; path: string; is_primary: boolean }[],
  deletedImageIds: string[]
) {
  const validated = productSchema.safeParse(values);
  if (!validated.success) {
    return {
      success: false,
      data: null,
      error: validated.error.errors[0].message,
    };
  }

  try {
    const product = await productService.updateProduct(
      id,
      validated.data,
      images,
      deletedImageIds
    );
    revalidatePath("/products");
    revalidatePath(`/products/${id}`);
    revalidatePath("/dashboard");
    return { success: true, data: product, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

export async function deleteProductAction(id: string) {
  try {
    await productService.deleteProduct(id);
    revalidatePath("/products");
    revalidatePath("/dashboard");
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: parseError(error) };
  }
}

export async function bulkDeleteProductsAction(ids: string[]) {
  try {
    await productService.bulkDeleteProducts(ids);
    revalidatePath("/products");
    revalidatePath("/dashboard");
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: parseError(error) };
  }
}

export async function updateProductStatusAction(
  ids: string[],
  status: "active" | "inactive" | "draft"
) {
  const validated = bulkStatusSchema.safeParse({ ids, status });
  if (!validated.success) {
    return { success: false, error: "Invalid input" };
  }

  try {
    await productService.updateProductStatus(ids, status);
    revalidatePath("/products");
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: parseError(error) };
  }
}

export async function getDashboardStatsAction() {
  try {
    const stats = await productService.getDashboardStats();
    return { success: true, data: stats, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

// ============================================================
// Categories
// ============================================================

export async function getCategoriesAction(filters?: CategoryFilters) {
  try {
    const categories = await categoryService.getCategories(filters);
    return { success: true, data: categories, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

export async function createCategoryAction(
  values: unknown,
  image?: { url: string; path: string } | null
) {
  const validated = categorySchema.safeParse(values);
  if (!validated.success) {
    return {
      success: false,
      data: null,
      error: validated.error.errors[0].message,
    };
  }
  try {
    const category = await categoryService.createCategory(validated.data, image);
    revalidatePath("/categories");
    revalidatePath("/products");
    return { success: true, data: category, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

export async function updateCategoryAction(
  id: string,
  values: unknown,
  image?: { url: string; path: string } | null,
  removeImage?: boolean
) {
  const validated = categorySchema.safeParse(values);
  if (!validated.success) {
    return {
      success: false,
      data: null,
      error: validated.error.errors[0].message,
    };
  }
  try {
    const category = await categoryService.updateCategory(
      id,
      validated.data,
      image,
      removeImage
    );
    revalidatePath("/categories");
    revalidatePath("/products");
    return { success: true, data: category, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

export async function deleteCategoryAction(id: string) {
  try {
    await categoryService.deleteCategory(id);
    revalidatePath("/categories");
    revalidatePath("/products");
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: parseError(error) };
  }
}

export async function toggleCategoryStatusAction(
  id: string,
  status: "active" | "inactive"
) {
  try {
    await categoryService.toggleStatus(id, status);
    revalidatePath("/categories");
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: parseError(error) };
  }
}

// ============================================================
// Brands
// ============================================================

export async function getBrandsAction(filters?: BrandFilters) {
  try {
    const brands = await brandService.getBrands(filters);
    return { success: true, data: brands, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

export async function createBrandAction(
  values: unknown,
  logo?: { url: string; path: string } | null
) {
  const validated = brandSchema.safeParse(values);
  if (!validated.success) {
    return {
      success: false,
      data: null,
      error: validated.error.errors[0].message,
    };
  }
  try {
    const brand = await brandService.createBrand(validated.data, logo);
    revalidatePath("/brands");
    revalidatePath("/products");
    return { success: true, data: brand, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

export async function updateBrandAction(
  id: string,
  values: unknown,
  logo?: { url: string; path: string } | null,
  removeLogo?: boolean
) {
  const validated = brandSchema.safeParse(values);
  if (!validated.success) {
    return {
      success: false,
      data: null,
      error: validated.error.errors[0].message,
    };
  }
  try {
    const brand = await brandService.updateBrand(id, validated.data, logo, removeLogo);
    revalidatePath("/brands");
    revalidatePath("/products");
    return { success: true, data: brand, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

export async function deleteBrandAction(id: string) {
  try {
    await brandService.deleteBrand(id);
    revalidatePath("/brands");
    revalidatePath("/products");
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: parseError(error) };
  }
}

export async function toggleBrandStatusAction(
  id: string,
  status: "active" | "inactive"
) {
  try {
    await brandService.toggleStatus(id, status);
    revalidatePath("/brands");
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: parseError(error) };
  }
}
