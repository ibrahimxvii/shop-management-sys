"use server";

import { createClient } from "@/lib/supabase/server";
import { runAction } from "@/lib/errors";

const ALLOWED_BUCKETS = [
  "product-images",
  "category-images",
  "brand-logos",
  "profile-avatars",
  "employee-avatars",
  "shop-assets",
] as const;

type AllowedBucket = (typeof ALLOWED_BUCKETS)[number];

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function isAllowedBucket(bucket: string): bucket is AllowedBucket {
  return (ALLOWED_BUCKETS as readonly string[]).includes(bucket);
}

export async function uploadImageAction(formData: FormData) {
  return runAction(async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const file = formData.get("file");
    const bucket = formData.get("bucket");
    const folder = formData.get("folder");

    if (!(file instanceof File)) throw new Error("No file provided");
    if (typeof bucket !== "string" || !isAllowedBucket(bucket)) {
      throw new Error("Invalid upload destination");
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error("Only JPG, PNG, WebP, or GIF images are allowed");
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error("File must be under 5 MB");
    }

    const ext = file.name.split(".").pop() ?? "jpg";
    const safeFolder = typeof folder === "string" && folder ? folder.replace(/[^a-zA-Z0-9_-]/g, "") : "uploads";
    const path = `${safeFolder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });
    if (error) {
      console.error("[uploadImageAction] storage upload failed:", {
        bucket,
        path,
        userId: user.id,
        error,
      });
      throw new Error(error.message);
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return { url: data.publicUrl, path };
  });
}

export async function deleteImageAction(bucket: string, path: string) {
  return runAction(async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    if (!isAllowedBucket(bucket)) throw new Error("Invalid upload destination");

    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw new Error(error.message);
  });
}
