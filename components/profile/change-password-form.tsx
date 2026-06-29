"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePasswordSchema, type ChangePasswordValues } from "@/lib/validations/profile";
import { changePasswordAction } from "@/app/actions/profile.actions";

export function ChangePasswordForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  const onSubmit = async (values: ChangePasswordValues) => {
    const result = await changePasswordAction(values);
    if (!result.success) {
      toast.error(result.error ?? "Failed to change password");
      return;
    }
    toast.success("Password changed successfully");
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="current_password">Current Password *</Label>
        <Input
          id="current_password"
          type="password"
          {...register("current_password")}
          placeholder="Your current password"
          autoComplete="current-password"
        />
        {errors.current_password && (
          <p className="text-xs text-destructive">{errors.current_password.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="new_password">New Password *</Label>
        <Input
          id="new_password"
          type="password"
          {...register("new_password")}
          placeholder="At least 8 characters"
          autoComplete="new-password"
        />
        {errors.new_password && (
          <p className="text-xs text-destructive">{errors.new_password.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirm_password">Confirm New Password *</Label>
        <Input
          id="confirm_password"
          type="password"
          {...register("confirm_password")}
          placeholder="Repeat new password"
          autoComplete="new-password"
        />
        {errors.confirm_password && (
          <p className="text-xs text-destructive">{errors.confirm_password.message}</p>
        )}
      </div>

      <div className="flex justify-end pt-1">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Changing..." : "Change Password"}
        </Button>
      </div>
    </form>
  );
}
