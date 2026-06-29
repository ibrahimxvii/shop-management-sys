"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SingleImageUploader } from "@/components/ui/single-image-uploader";
import { profileUpdateSchema, type ProfileUpdateValues } from "@/lib/validations/profile";
import { updateProfileAction } from "@/app/actions/profile.actions";
import { useAuthStore } from "@/store/auth.store";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface ProfileFormProps {
  profile: Profile;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const { setProfile } = useAuthStore();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileUpdateValues>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      full_name: profile.full_name ?? "",
      avatar_url: profile.avatar_url ?? "",
      avatar_path: "",
    },
  });

  const avatarUrl = watch("avatar_url");
  const avatarPath = watch("avatar_path");

  const onSubmit = async (values: ProfileUpdateValues) => {
    const result = await updateProfileAction(values);
    if (!result.success) {
      toast.error(result.error ?? "Failed to update profile");
      return;
    }
    if (result.data) {
      setProfile(result.data as Profile);
    }
    toast.success("Profile updated successfully");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <Label>Avatar</Label>
        <SingleImageUploader
          bucket="profile-avatars"
          folder="avatars"
          value={avatarUrl ? { url: avatarUrl, path: avatarPath ?? "" } : null}
          onChange={(img) => {
            setValue("avatar_url", img?.url ?? "");
            setValue("avatar_path", img?.path ?? "");
          }}
          label="avatar"
          className="max-w-xs"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pf_full_name">Full Name *</Label>
        <Input id="pf_full_name" {...register("full_name")} placeholder="Your name" />
        {errors.full_name && (
          <p className="text-xs text-destructive">{errors.full_name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input value={profile.email ?? ""} disabled className="text-muted-foreground" />
        <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
      </div>

      <div className="space-y-1.5">
        <Label>Role</Label>
        <Input value={profile.role ?? "staff"} disabled className="capitalize text-muted-foreground" />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
