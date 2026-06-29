"use client";

import * as React from "react";
import Image from "next/image";
import { Upload, X, Loader2, AlertCircle, ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UploadedImage {
  url: string;
  path: string;
}

interface SingleImageUploaderProps {
  value: UploadedImage | null;
  onChange: (image: UploadedImage | null) => void;
  bucket: string;
  folder?: string;
  className?: string;
  label?: string;
}

export function SingleImageUploader({
  value,
  onChange,
  bucket,
  folder = "uploads",
  className,
  label = "image",
}: SingleImageUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const uploadFile = async (file: File): Promise<UploadedImage> => {
    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (error) throw new Error(error.message);

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return { url: data.publicUrl, path };
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Please upload an image file");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setUploadError("File must be under 3 MB");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    try {
      const result = await uploadFile(file);
      onChange(result);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    onChange(null);
    setUploadError(null);
  };

  if (value) {
    return (
      <div className={cn("relative group rounded-xl overflow-hidden border bg-muted", className)}>
        <div className="relative aspect-video w-full">
          <Image
            src={value.url}
            alt={`Uploaded ${label}`}
            fill
            className="object-contain p-2"
            sizes="(max-width: 640px) 100vw, 400px"
          />
        </div>
        <Button
          type="button"
          variant="destructive"
          size="icon-sm"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleRemove}
          aria-label={`Remove ${label}`}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="absolute inset-0 flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <span className="rounded-full bg-background/90 px-3 py-1 text-xs font-medium shadow">
            Change {label}
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={handleInputChange}
        />
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors duration-200 cursor-pointer",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/30",
          isUploading && "pointer-events-none opacity-60"
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isUploading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label={`Upload ${label}`}
        onKeyDown={(e) => e.key === "Enter" && !isUploading && inputRef.current?.click()}
      >
        {isUploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm font-medium">Uploading…</p>
          </>
        ) : uploadError ? (
          <>
            <div className="mb-3 rounded-xl p-3 bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <p className="text-sm font-medium text-destructive">{uploadError}</p>
            <p className="text-xs text-muted-foreground mt-1">Click to try again</p>
          </>
        ) : (
          <>
            <div className={cn(
              "mb-3 rounded-xl p-3 transition-colors",
              isDragging ? "bg-primary/10" : "bg-muted"
            )}>
              {isDragging ? (
                <Upload className="h-6 w-6 text-primary" />
              ) : (
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <p className="text-sm font-medium">
              {isDragging ? "Drop here" : `Drag & drop or click to upload`}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PNG, JPG, WebP up to 3 MB
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={handleInputChange}
        />
      </div>
    </div>
  );
}
