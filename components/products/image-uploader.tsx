"use client";

import * as React from "react";
import Image from "next/image";
import {
  ImagePlus,
  X,
  Star,
  Loader2,
  AlertCircle,
  Upload,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ManagedImage {
  localId: string;
  url: string;
  path: string;
  isPrimary: boolean;
  isUploading: boolean;
  error?: string;
  isExisting?: boolean;
  existingId?: string;
}

interface ImageUploaderProps {
  value: ManagedImage[];
  onChange: React.Dispatch<React.SetStateAction<ManagedImage[]>>;
  deletedIds?: string[];
  onDeletedIdsChange?: (ids: string[]) => void;
  maxImages?: number;
  className?: string;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB — matches the product-images bucket limit

function generateLocalId() {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Only JPG, PNG, WebP, or GIF images are allowed";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "File must be under 5 MB";
  }
  return null;
}

export function ImageUploader({
  value,
  onChange,
  deletedIds = [],
  onDeletedIdsChange,
  maxImages = 8,
  className,
}: ImageUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const canAdd = value.length < maxImages;

  const uploadFile = React.useCallback(
    async (file: File): Promise<{ url: string; path: string } | null> => {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error } = await supabase.storage
        .from("product-images")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (error) throw new Error(error.message);

      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      return { url: data.publicUrl, path };
    },
    []
  );

  const handleFiles = React.useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const allowed = Math.min(fileArray.length, maxImages - value.length);
      const toProcess = fileArray.slice(0, allowed);

      const placeholders: ManagedImage[] = toProcess.map((_, idx) => ({
        localId: generateLocalId(),
        url: "",
        path: "",
        isPrimary: value.length === 0 && idx === 0,
        isUploading: true,
      }));

      onChange([...value, ...placeholders]);

      for (let i = 0; i < toProcess.length; i++) {
        const file = toProcess[i];
        const placeholder = placeholders[i];

        const validationError = validateFile(file);
        if (validationError) {
          onChange((prev: ManagedImage[]) =>
            prev.map((img) =>
              img.localId === placeholder.localId
                ? { ...img, isUploading: false, error: validationError }
                : img
            )
          );
          continue;
        }

        try {
          const result = await uploadFile(file);
          onChange((prev: ManagedImage[]) =>
            prev.map((img) =>
              img.localId === placeholder.localId
                ? {
                    ...img,
                    url: result?.url ?? "",
                    path: result?.path ?? "",
                    isUploading: false,
                  }
                : img
            )
          );
        } catch {
          onChange((prev: ManagedImage[]) =>
            prev.map((img) =>
              img.localId === placeholder.localId
                ? { ...img, isUploading: false, error: "Upload failed" }
                : img
            )
          );
        }
      }
    },
    [value, maxImages, onChange, uploadFile]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0 && canAdd) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemove = (localId: string) => {
    const img = value.find((i) => i.localId === localId);
    if (!img) return;

    onChange((prev) => {
      const next = prev.filter((i) => i.localId !== localId);
      if (img.isPrimary && next.length > 0) {
        next[0] = { ...next[0], isPrimary: true };
      }
      return next;
    });

    if (img.isExisting && img.existingId) {
      onDeletedIdsChange?.([...deletedIds, img.existingId]);
    }
  };

  const handleSetPrimary = (localId: string) => {
    onChange((prev) =>
      prev.map((img) => ({ ...img, isPrimary: img.localId === localId }))
    );
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Drop zone */}
      {canAdd && (
        <div
          className={cn(
            "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors duration-200 cursor-pointer",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/30"
          )}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Upload images"
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        >
          <div className={cn(
            "mb-3 rounded-xl p-3 transition-colors",
            isDragging ? "bg-primary/10" : "bg-muted"
          )}>
            <Upload
              className={cn("h-6 w-6", isDragging ? "text-primary" : "text-muted-foreground")}
              aria-hidden="true"
            />
          </div>
          <p className="text-sm font-medium">
            {isDragging ? "Drop images here" : "Drag & drop or click to upload"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PNG, JPG, WebP up to 5 MB — {value.length}/{maxImages} uploaded
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="sr-only"
            onChange={handleInputChange}
            aria-hidden="true"
          />
        </div>
      )}

      {/* Image grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {value.map((img) => (
            <div
              key={img.localId}
              className={cn(
                "group relative aspect-square rounded-lg overflow-hidden border bg-muted",
                img.isPrimary && "ring-2 ring-primary ring-offset-1"
              )}
            >
              {img.isUploading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Uploading…</span>
                </div>
              ) : img.error ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-destructive/10 p-2 text-center">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                  <span className="text-xs text-destructive font-medium">{img.error}</span>
                </div>
              ) : img.url ? (
                <Image
                  src={img.url}
                  alt="Product image"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, 33vw"
                />
              ) : null}

              {/* Overlay actions */}
              {!img.isUploading && !img.error && img.url && (
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!img.isPrimary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(img.localId)}
                      className="rounded-full bg-background/90 p-1.5 hover:bg-background transition-colors"
                      title="Set as primary image"
                    >
                      <Star className="h-3.5 w-3.5 text-warning-foreground" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemove(img.localId)}
                    className="rounded-full bg-destructive/90 p-1.5 hover:bg-destructive transition-colors"
                    title="Remove image"
                  >
                    <X className="h-3.5 w-3.5 text-white" />
                  </button>
                </div>
              )}

              {/* Primary badge */}
              {img.isPrimary && !img.isUploading && (
                <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  <Star className="h-2.5 w-2.5 fill-current" />
                  Primary
                </div>
              )}

              {/* Remove button for error state */}
              {img.error && (
                <button
                  type="button"
                  onClick={() => handleRemove(img.localId)}
                  className="absolute top-1 right-1 rounded-full bg-background/80 p-1"
                  title="Remove"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}

          {/* Add more placeholder */}
          {canAdd && value.length > 0 && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 transition-colors flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <ImagePlus className="h-5 w-5" />
              <span className="text-xs font-medium">Add more</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
