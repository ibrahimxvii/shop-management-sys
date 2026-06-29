import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/auth";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  fullName: string | null;
}

/**
 * Verifies the caller has a valid Supabase session and returns their profile.
 * Throws if unauthenticated — callers run inside server actions, so the
 * thrown error is caught by the action's own try/catch and surfaced as a
 * user-facing error message.
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (!profile) throw new Error("Profile not found");

  return {
    id: user.id,
    email: user.email ?? "",
    role: profile.role,
    fullName: profile.full_name,
  };
}

/**
 * Verifies the caller is authenticated AND holds one of the allowed roles.
 * Use this at the top of any server action that mutates admin-only or
 * manager-only resources (settings, employees, reports, etc).
 */
export async function requireRole(
  ...allowedRoles: UserRole[]
): Promise<AuthenticatedUser> {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new Error(
      `This action requires one of the following roles: ${allowedRoles.join(", ")}`
    );
  }
  return user;
}
