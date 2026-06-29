"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SingleImageUploader } from "@/components/ui/single-image-uploader";
import { categorySchema, type CategoryFormValues } from "@/lib/validations/product";
import type { Category } from "@/types/products";

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  onSubmit: (
    values: CategoryFormValues,
    image: { url: string; path: string } | null,
    removeImage: boolean
  ) => Promise<void>;
  isLoading?: boolean;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  onSubmit,
  isLoading = false,
}: CategoryFormDialogProps) {
  const isEditing = !!category;

  const [image, setImage] = React.useState<{ url: string; path: string } | null>(null);
  const [removeImage, setRemoveImage] = React.useState(false);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      status: "active",
    },
  });

  React.useEffect(() => {
    if (open) {
      if (category) {
        form.reset({
          name: category.name,
          slug: category.slug,
          description: category.description ?? "",
          status: category.status,
        });
        setImage(
          category.image_url && category.image_path
            ? { url: category.image_url, path: category.image_path }
            : null
        );
        setRemoveImage(false);
      } else {
        form.reset({ name: "", slug: "", description: "", status: "active" });
        setImage(null);
        setRemoveImage(false);
      }
    }
  }, [open, category, form]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    form.setValue("name", e.target.value);
    if (!isEditing) {
      form.setValue("slug", slugify(e.target.value), { shouldValidate: true });
    }
  };

  const handleImageChange = (img: { url: string; path: string } | null) => {
    setImage(img);
    if (!img && category?.image_url) {
      setRemoveImage(true);
    } else {
      setRemoveImage(false);
    }
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values, image, removeImage);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Category" : "Add Category"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the category details below."
              : "Fill in the details to create a new category."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cat-name"
                placeholder="e.g. Electronics"
                {...form.register("name")}
                onChange={handleNameChange}
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            {/* Slug */}
            <div className="space-y-1.5">
              <Label htmlFor="cat-slug">
                Slug <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cat-slug"
                placeholder="e.g. electronics"
                {...form.register("slug")}
              />
              {form.formState.errors.slug && (
                <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="cat-desc">Description</Label>
            <Textarea
              id="cat-desc"
              placeholder="Brief description of this category…"
              rows={3}
              {...form.register("description")}
            />
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select
              value={form.watch("status")}
              onValueChange={(v) =>
                form.setValue("status", v as "active" | "inactive", { shouldValidate: true })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Image */}
          <div className="space-y-1.5">
            <Label>Category Image</Label>
            <SingleImageUploader
              value={image}
              onChange={handleImageChange}
              bucket="category-images"
              folder="categories"
              label="category image"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isEditing ? "Saving…" : "Creating…"}
                </>
              ) : isEditing ? (
                "Save changes"
              ) : (
                "Create category"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
