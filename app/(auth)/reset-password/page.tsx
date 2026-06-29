"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Lock, Eye, EyeOff, ShieldCheck, CheckCircle2 } from "lucide-react";

import { authService } from "@/services/auth.service";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { label: "One number", test: (v: string) => /[0-9]/.test(v) },
];

export default function ResetPasswordPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [done, setDone] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    try {
      await authService.resetPassword(data.password);
      setDone(true);
      toast.success("Password updated successfully!");
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to reset password"
      );
    }
  };

  if (done) {
    return (
      <div className="w-full max-w-[420px] text-center space-y-6">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10 border border-success/20">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Password updated</h1>
          <p className="text-sm text-muted-foreground">
            Your new password has been saved. Redirecting to your dashboard…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[420px] space-y-6">
      {/* Heading */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Set a new password
        </h1>
        <p className="text-sm text-muted-foreground">
          Choose a strong password for your ShopFlow account.
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-4"
      >
        {/* New password */}
        <div className="space-y-1.5">
          <Label htmlFor="password" required>
            New password
          </Label>
          <Input
            {...register("password", {
              onChange: (e) => setPassword(e.target.value),
            })}
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Choose a strong password"
            error={!!errors.password}
            leftIcon={<Lock className="h-4 w-4" />}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            }
          />
          {errors.password && (
            <p role="alert" className="text-xs text-destructive">
              {errors.password.message}
            </p>
          )}

          {/* Live password strength checklist */}
          {password.length > 0 && (
            <ul className="mt-2 space-y-1" aria-label="Password requirements">
              {PASSWORD_RULES.map(({ label, test }) => {
                const passed = test(password);
                return (
                  <li
                    key={label}
                    className={cn(
                      "flex items-center gap-2 text-xs transition-colors duration-150",
                      passed ? "text-success" : "text-muted-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border text-[9px] font-bold",
                        passed
                          ? "border-success bg-success/10 text-success"
                          : "border-muted-foreground/30"
                      )}
                      aria-hidden="true"
                    >
                      {passed ? "✓" : ""}
                    </span>
                    {label}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Confirm password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirm_password" required>
            Confirm new password
          </Label>
          <Input
            {...register("confirm_password")}
            id="confirm_password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            error={!!errors.confirm_password}
            leftIcon={<Lock className="h-4 w-4" />}
          />
          {errors.confirm_password && (
            <p role="alert" className="text-xs text-destructive">
              {errors.confirm_password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          isLoading={isSubmitting}
          loadingText="Updating password…"
        >
          Update password
        </Button>
      </form>
    </div>
  );
}
