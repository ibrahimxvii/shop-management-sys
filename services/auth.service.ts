import { createClient } from "@/lib/supabase/client";
import type { LoginCredentials, RegisterCredentials } from "@/types/auth";

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const authService = {
  async login({ email, password }: LoginCredentials) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      // Map Supabase's generic "Invalid login credentials" to something nicer
      if (error.message.toLowerCase().includes("invalid login")) {
        throw new Error("Incorrect email or password.");
      }
      throw new Error(error.message);
    }
    return data;
  },

  async register({ email, password, full_name }: RegisterCredentials) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // full_name is passed as user metadata so the DB trigger can pick it up
        data: { full_name },
      },
    });
    if (error) throw new Error(error.message);
    return data;
  },

  async logout() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  },

  /**
   * Sends a password-reset email via PKCE flow.
   * The email link points to /auth/callback?next=/reset-password,
   * which exchanges the code and redirects the user to the reset form.
   */
  async forgotPassword(email: string) {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
    });
    if (error) throw new Error(error.message);
  },

  /**
   * Updates the authenticated user's password.
   * Must be called while the user has a valid reset session.
   */
  async resetPassword(password: string) {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message);
  },

  async getUser() {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return data.user;
  },
};
