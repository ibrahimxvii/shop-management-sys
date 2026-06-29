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
import { brandSchema, type BrandFormValues, type BrandFormInput } from "@/lib/validations/product";
import type { Brand } from "@/types/products";

interface BrandFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand?: Brand | null;
  onSubmit: (
    values: BrandFormValues,
    logo: { url: string; path: string } | null,
    removeLogo: boolean
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

export function BrandFormDialog({
  open,
  onOpenChange,
  brand,
  onSubmit,
  isLoading = false,
}: BrandFormDialogProps) {
  const isEditing = !!brand;

  const [logo, setLogo] = React.useState<{ url: string; path: string } | null>(null);
  const [removeLogo, setRemoveLogo] = React.useState(false);

  const form = useForm<BrandFormInput, unknown, BrandFormValues>({
    resolver: zodResolver(brandSchema),
    defaultValues: { name: "", slug: "", description: "", status: "active" },
  });

  React.useEffect(() => {
    if (open) {
      if (brand) {
        form.reset({
          name: brand.name,
          slug: brand.slug,
          description: brand.description ?? "",
          status: brand.status,
        });
        setLogo(
          brand.logo_url && brand.logo_path
            ? { url: brand.logo_url, path: brand.logo_path }
            : null
        );
        setRemoveLogo(false);
      } else {
        form.reset({ name: "", slug: "", description: "", status: "active" });
        setLogo(null);
        setRemoveLogo(false);
      }
    }
  }, [open, brand, form]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    form.setValue("name", e.target.value);
    if (!isEditing) {
      form.setValue("slug", slugify(e.target.value), { shouldValidate: true });
    }
  };

  const handleLogoChange = (img: { url: string; path: string } | null) => {
    setLogo(img);
    if (!img && brand?.logo_url) {
      setRemoveLogo(true);
    } else {
      setRemoveLogo(false);
    }
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values, logo, removeLogo);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Brand" : "Add Brand"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the brand details below."
              : "Fill in the details to create a new brand."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="brand-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="brand-name"
                placeholder="e.g. Acme Corp"
                {...form.register("name")}
                onChange={handleNameChange}
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="brand-slug">
                Slug <span className="text-destructive">*</span>
              </Label>
              <Input
                id="brand-slug"
                placeholder="e.g. acme-corp"
                {...form.register("slug")}
              />
              {form.formState.errors.slug && (
                <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="brand-desc">Description</Label>
            <Textarea
              id="brand-desc"
              placeholder="Brief description of this brand…"
              rows={3}
              {...form.register("description")}
            />
          </div>

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

          <div className="space-y-1.5">
            <Label>Brand Logo</Label>
            <SingleImageUploader
              value={logo}
              onChange={handleLogoChange}
              bucket="brand-logos"
              folder="brands"
              label="brand logo"
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
                "Create brand"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
