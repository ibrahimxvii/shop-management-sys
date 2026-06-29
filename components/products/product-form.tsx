"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Plus, Hash } from "lucide-react";
import { productSchema, type ProductFormValues, type ProductFormInput } from "@/lib/validations/product";
import { useCreateProduct, useUpdateProduct } from "@/hooks/use-products";
import { useCategories } from "@/hooks/use-categories";
import { useBrands } from "@/hooks/use-brands";
import { ImageUploader, type ManagedImage } from "./image-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ProductWithRelations } from "@/types/products";

interface FieldErrorProps {
  message?: string;
}
function FieldError({ message }: FieldErrorProps) {
  if (!message) return null;
  return <p className="text-xs text-destructive mt-1">{message}</p>;
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

interface ProductFormProps {
  product?: ProductWithRelations;
}

function buildInitialImages(product?: ProductWithRelations): ManagedImage[] {
  if (!product?.images) return [];
  return product.images.map((img) => ({
    localId: `existing_${img.id}`,
    url: img.url,
    path: img.path,
    isPrimary: img.is_primary,
    isUploading: false,
    isExisting: true,
    existingId: img.id,
  }));
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const isEdit = !!product;

  const [images, setImages] = React.useState<ManagedImage[]>(() =>
    buildInitialImages(product)
  );
  const [deletedImageIds, setDeletedImageIds] = React.useState<string[]>([]);

  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct(product?.id ?? "");

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name ?? "",
      description: product?.description ?? "",
      sku: product?.sku ?? "",
      barcode: product?.barcode ?? "",
      category_id: product?.category_id ?? "",
      brand_id: product?.brand_id ?? "",
      purchase_price: product?.purchase_price ?? 0,
      selling_price: product?.selling_price ?? 0,
      quantity: product?.quantity ?? 0,
      low_stock_limit: product?.low_stock_limit ?? 10,
      status: product?.status ?? "active",
      is_featured: product?.is_featured ?? false,
      tags: product?.tags ?? [],
    },
  });

  const tags = watch("tags") ?? [];
  const [tagInput, setTagInput] = React.useState("");

  const addTag = (raw: string) => {
    const tag = raw.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setValue("tags", [...tags, tag]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setValue("tags", tags.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    }
    if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const onSubmit = async (values: ProductFormValues) => {
    // Only pass genuinely new uploads — existing DB images are tracked via deletedImageIds
    const newImages = images
      .filter((img) => !img.isUploading && !img.error && img.url && !img.isExisting)
      .map((img) => ({
        url: img.url,
        path: img.path,
        is_primary: img.isPrimary,
      }));

    // For create mode, all images are "new"
    const allImages = images
      .filter((img) => !img.isUploading && !img.error && img.url)
      .map((img) => ({
        url: img.url,
        path: img.path,
        is_primary: img.isPrimary,
      }));

    if (isEdit) {
      const result = await updateProduct.mutateAsync({
        values,
        images: newImages,
        deletedImageIds,
      });
      if (result.success) {
        router.push(`/products/${product.id}`);
      }
    } else {
      const result = await createProduct.mutateAsync({ values, images: allImages });
      if (result.success && result.data) {
        reset();
        setImages([]);
        setTagInput("");
        router.push(`/products/${result.data.id}`);
      }
    }
  };

  const isBusy = isSubmitting || createProduct.isPending || updateProduct.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — main info */}
        <div className="lg:col-span-2 space-y-6">
          <FormSection title="Basic Information">
            <div className="space-y-1.5">
              <Label htmlFor="name" required>
                Product Name
              </Label>
              <Input
                id="name"
                placeholder="e.g. Wireless Bluetooth Headphones"
                {...register("name")}
                aria-invalid={!!errors.name}
              />
              <FieldError message={errors.name?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your product…"
                className="min-h-[120px]"
                {...register("description")}
                aria-invalid={!!errors.description}
              />
              <FieldError message={errors.description?.message} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  placeholder="e.g. WBH-001"
                  {...register("sku")}
                />
                <FieldError message={errors.sku?.message} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  placeholder="e.g. 0012345678901"
                  {...register("barcode")}
                />
                <FieldError message={errors.barcode?.message} />
              </div>
            </div>
          </FormSection>

          <FormSection title="Pricing & Inventory">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="purchase_price">Purchase Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    $
                  </span>
                  <Input
                    id="purchase_price"
                    type="number"
                    min="0"
                    step="0.01"
                    className="pl-7"
                    {...register("purchase_price")}
                    aria-invalid={!!errors.purchase_price}
                  />
                </div>
                <FieldError message={errors.purchase_price?.message} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="selling_price">Selling Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    $
                  </span>
                  <Input
                    id="selling_price"
                    type="number"
                    min="0"
                    step="0.01"
                    className="pl-7"
                    {...register("selling_price")}
                    aria-invalid={!!errors.selling_price}
                  />
                </div>
                <FieldError message={errors.selling_price?.message} />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="quantity">Stock Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  {...register("quantity")}
                  aria-invalid={!!errors.quantity}
                />
                <FieldError message={errors.quantity?.message} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="low_stock_limit">Low Stock Alert Limit</Label>
                <Input
                  id="low_stock_limit"
                  type="number"
                  min="0"
                  {...register("low_stock_limit")}
                  aria-invalid={!!errors.low_stock_limit}
                />
                <p className="text-xs text-muted-foreground">
                  Alert when stock falls to or below this number
                </p>
                <FieldError message={errors.low_stock_limit?.message} />
              </div>
            </div>
          </FormSection>

          <FormSection title="Organization">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="category_id">Category</Label>
                <Controller
                  control={control}
                  name="category_id"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger id="category_id">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No category</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="brand_id">Brand</Label>
                <Controller
                  control={control}
                  name="brand_id"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger id="brand_id">
                        <SelectValue placeholder="Select brand" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No brand</SelectItem>
                        {brands.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Tags</Label>
              <div
                className={cn(
                  "flex flex-wrap gap-1.5 min-h-[38px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm",
                  "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                )}
              >
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium"
                  >
                    <Hash className="h-2.5 w-2.5 text-muted-foreground" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-0.5 rounded-full hover:text-destructive transition-colors"
                      aria-label={`Remove tag ${tag}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={() => tagInput.trim() && addTag(tagInput)}
                  placeholder={tags.length === 0 ? "Add tags (press Enter or comma)" : ""}
                  className="flex-1 min-w-[120px] bg-transparent outline-none placeholder:text-muted-foreground text-sm"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Press Enter or comma to add a tag
              </p>
            </div>
          </FormSection>
        </div>

        {/* Right column — images + settings */}
        <div className="space-y-6">
          <FormSection title="Product Images">
            <ImageUploader
              value={images}
              onChange={setImages}
              deletedIds={deletedImageIds}
              onDeletedIdsChange={setDeletedImageIds}
            />
            <p className="text-xs text-muted-foreground">
              The starred image is used as the primary/cover image
            </p>
          </FormSection>

          <FormSection title="Status & Settings">
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active — visible in listings</SelectItem>
                      <SelectItem value="inactive">Inactive — hidden</SelectItem>
                      <SelectItem value="draft">Draft — work in progress</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Featured Product</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Highlight this product in your store
                </p>
              </div>
              <Controller
                control={control}
                name="is_featured"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-label="Featured product"
                  />
                )}
              />
            </div>
          </FormSection>

          {/* Form actions */}
          <div className="flex flex-col gap-2">
            <Button type="submit" isLoading={isBusy} loadingText="Saving…" className="w-full">
              {isEdit ? "Save Changes" : "Create Product"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => router.back()}
              disabled={isBusy}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
