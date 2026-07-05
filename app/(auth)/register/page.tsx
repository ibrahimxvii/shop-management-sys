"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

import { authService } from "@/services/auth.service";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = React.useState(false);
  const [emailSent, setEmailSent] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      await authService.register({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
      });
      setEmailSent(data.email);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create account"
      );
    }
  };

  if (emailSent) {
    return (
      <div className="w-full max-w-[420px] text-center space-y-6">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Check your inbox</h1>
          <p className="text-sm text-muted-foreground">
            We sent a confirmation link to{" "}
            <strong className="text-foreground font-medium">{emailSent}</strong>
            . Click it to activate your account.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground text-left space-y-1">
          <p className="font-medium text-foreground">Didn&apos;t get the email?</p>
          <p>Check your spam folder, or wait a minute and try again.</p>
        </div>
        <Button variant="outline" asChild className="w-full">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[420px] space-y-6">
      {/* Heading */}
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Create your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Start managing your shop in under 2 minutes.
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-4"
      >
        {/* Full name */}
        <div className="space-y-1.5">
          <Label htmlFor="full_name" required>
            Full name
          </Label>
          <Input
            {...register("full_name")}
            id="full_name"
            type="text"
            autoComplete="name"
            placeholder="Jane Smith"
            error={!!errors.full_name}
            leftIcon={<User className="h-4 w-4" />}
          />
          {errors.full_name && (
            <p role="alert" className="text-xs text-destructive">
              {errors.full_name.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" required>
            Email address
          </Label>
          <Input
            {...register("email")}
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            error={!!errors.email}
            leftIcon={<Mail className="h-4 w-4" />}
          />
          {errors.email && (
            <p role="alert" className="text-xs text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password" required>
            Password
          </Label>
          <Input
            {...register("password")}
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Min. 8 chars, 1 uppercase, 1 number"
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
        </div>

        {/* Confirm password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirm_password" required>
            Confirm password
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

        {/* Terms note */}
        <p className="text-xs text-muted-foreground">
          By creating an account you agree to our{" "}
          <a href="#" className="underline underline-offset-4 hover:text-foreground transition-colors">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="underline underline-offset-4 hover:text-foreground transition-colors">
            Privacy Policy
          </a>
          .
        </p>

        <Button
          type="submit"
          size="lg"
          className="w-full gap-2"
          isLoading={isSubmitting}
          loadingText="Creating account…"
        >
          Create account
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-3 text-muted-foreground">
            Already have an account?
          </span>
        </div>
      </div>

      <Button variant="outline" size="lg" className="w-full" asChild>
        <Link href="/login">Sign in instead</Link>
      </Button>
    </div>
  );
}
