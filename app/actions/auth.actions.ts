"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";
import type { LoginInput, ForgotPasswordInput, ResetPasswordInput } from "@/lib/validations/auth";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

// Distinct from lib/errors.ts's ActionResult — this auth-specific shape omits
// `success` since callers here only ever check `error` truthiness.
interface AuthActionResult<T = void> {
  data?: T;
  error?: string;
}

/**
 * Server action: sign in with email + password.
 * Returns an error string on failure; redirects on success.
 */
export async function signInAction(
  input: LoginInput
): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // Supabase returns generic messages — map to user-friendly text
    if (error.message.toLowerCase().includes("invalid login")) {
      return { error: "Incorrect email or password." };
    }
    return { error: error.message };
  }

  redirect("/dashboard");
}

/**
 * Server action: send a password-reset email (PKCE flow).
 */
export async function forgotPasswordAction(
  input: ForgotPasswordInput
): Promise<AuthActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const supabase = await createClient();

  const siteUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      // Callback route exchanges the code, then redirects to reset-password
      redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
    }
  );

  if (error) return { error: error.message };

  return {};
}

/**
 * Server action: update password after reset link is clicked.
 * The user must already have a valid session (set by /auth/callback).
 */
export async function resetPasswordAction(
  input: ResetPasswordInput
): Promise<AuthActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) return { error: error.message };

  redirect("/dashboard");
}

/**
 * Server action: sign out and clear session.
 */
export async function signOutAction(): Promise<AuthActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) return { error: error.message };
  redirect("/login");
}

/**
 * Server action: fetch the current user's profile from the DB.
 * Used by server components to hydrate the initial session.
 */
export async function getCurrentProfileAction(): Promise<
  AuthActionResult<Profile>
> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) return { error: error.message };
  return { data };
}
