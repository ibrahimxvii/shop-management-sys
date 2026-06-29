"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Mail, ArrowLeft, Send, CheckCircle2 } from "lucide-react";

import { authService } from "@/services/auth.service";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { logger } from "@/lib/logger";

export default function ForgotPasswordPage() {
  const [sentTo, setSentTo] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    try {
      await authService.forgotPassword(data.email);
      setSentTo(data.email);
    } catch (error) {
      // Don't reveal whether the email exists — show a success message anyway
      // but log for debugging
      logger.error("[forgot-password]", error);
      setSentTo(data.email);
    }
  };

  if (sentTo) {
    return (
      <div className="w-full max-w-[420px] space-y-6">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Check your email
          </h1>
          <p className="text-sm text-muted-foreground">
            If an account exists for{" "}
            <strong className="text-foreground font-medium">{sentTo}</strong>,
            you'll receive a reset link within a minute.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm space-y-2">
          <p className="font-medium text-foreground text-xs uppercase tracking-wide">
            What to do next
          </p>
          <ol className="space-y-1.5 text-xs text-muted-foreground list-decimal list-inside">
            <li>Open the email from ShopFlow</li>
            <li>Click the "Reset password" link</li>
            <li>Choose a new password on the next screen</li>
          </ol>
          <p className="text-xs text-muted-foreground pt-1">
            The link expires in <strong className="text-foreground">1 hour</strong>.
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setSentTo(null)}
          >
            Resend link
          </Button>
          <Button variant="ghost" className="w-full" asChild>
            <Link href="/login">
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[420px] space-y-6">
      {/* Heading */}
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Reset your password
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a secure reset link.
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-4"
      >
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
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email && (
            <p
              id="email-error"
              role="alert"
              className="text-xs text-destructive"
            >
              {errors.email.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full gap-2"
          isLoading={isSubmitting}
          loadingText="Sending link…"
        >
          Send reset link
          <Send className="h-4 w-4" aria-hidden="true" />
        </Button>
      </form>

      {/* Back link */}
      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
