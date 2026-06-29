"use server";

import { createClient } from "@/lib/supabase/server";
import { profileService } from "@/services/profile.service";
import { profileUpdateSchema, changePasswordSchema } from "@/lib/validations/profile";
import { parseError } from "@/lib/errors";

async function getAuthUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return user.id;
}

export async function getCurrentProfileAction() {
  try {
    const userId = await getAuthUserId();
    const profile = await profileService.getProfile(userId);
    return { success: true, data: profile, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

export async function updateProfileAction(values: unknown) {
  const validated = profileUpdateSchema.safeParse(values);
  if (!validated.success) {
    return { success: false, data: null, error: validated.error.errors[0].message };
  }

  try {
    const userId = await getAuthUserId();
    const profile = await profileService.updateProfile(userId, validated.data);
    return { success: true, data: profile, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

export async function changePasswordAction(values: unknown) {
  const validated = changePasswordSchema.safeParse(values);
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0].message };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) throw new Error("Unauthorized");

    // Re-authenticate with the current password before allowing a change —
    // updateUser() alone does not verify the caller actually knows the old password.
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: validated.data.current_password,
    });
    if (verifyError) {
      return { success: false, error: "Current password is incorrect" };
    }

    const { error } = await supabase.auth.updateUser({
      password: validated.data.new_password,
    });
    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: parseError(error) };
  }
}
