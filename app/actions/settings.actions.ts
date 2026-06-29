"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { settingsService } from "@/services/settings.service";
import { userPreferencesService } from "@/services/user-preferences.service";
import { activityLogService } from "@/services/activity-log.service";
import { securityService } from "@/services/security.service";
import {
  shopSettingsSchema,
  userPreferencesSchema,
  changePasswordSchema,
} from "@/lib/validations/settings";
import { parseError } from "@/lib/errors";
import { requireAuth, requireRole } from "@/lib/auth-helpers";

export async function getSettingsAction() {
  try {
    const data = await settingsService.getSettings();
    return { success: true, data, error: null };
  } catch (e) {
    return { success: false, data: null, error: parseError(e) };
  }
}

export async function updateSettingsAction(values: unknown) {
  const parsed = shopSettingsSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, data: null, error: parsed.error.errors[0].message };
  }

  try {
    const user = await requireRole("admin");

    const current = await settingsService.getSettings();
    const updated = await settingsService.updateSettings(current.id, parsed.data);

    await activityLogService.log({
      userId: user.id,
      userName: user.fullName ?? user.email,
      action: "settings_change",
      resource: "settings",
      resourceId: current.id,
      description: "Updated shop settings",
    });

    revalidatePath("/settings/shop");
    return { success: true, data: updated, error: null };
  } catch (e) {
    return { success: false, data: null, error: parseError(e) };
  }
}

export async function getUserPreferencesAction() {
  try {
    const user = await requireAuth();
    const data = await userPreferencesService.getPreferences(user.id);
    return { success: true, data, error: null };
  } catch (e) {
    return { success: false, data: null, error: parseError(e) };
  }
}

export async function updateUserPreferencesAction(values: unknown) {
  const parsed = userPreferencesSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, data: null, error: parsed.error.errors[0].message };
  }

  try {
    const user = await requireAuth();
    const data = await userPreferencesService.upsertPreferences(
      user.id,
      parsed.data
    );
    revalidatePath("/settings/system");
    return { success: true, data, error: null };
  } catch (e) {
    return { success: false, data: null, error: parseError(e) };
  }
}

export async function changePasswordAction(values: unknown) {
  const parsed = changePasswordSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  try {
    const user = await requireAuth();
    const supabase = await createClient();

    // Re-authenticate with the current password before allowing a change —
    // updateUser() alone does not verify the caller actually knows the old password.
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: parsed.data.current_password,
    });
    if (verifyError) {
      return { success: false, error: "Current password is incorrect" };
    }

    const { error } = await supabase.auth.updateUser({
      password: parsed.data.new_password,
    });
    if (error) return { success: false, error: error.message };

    await activityLogService.log({
      userId: user.id,
      userName: user.fullName ?? user.email,
      action: "password_change",
      resource: "auth",
      description: "Changed account password",
    });

    return { success: true, error: null };
  } catch (e) {
    return { success: false, error: parseError(e) };
  }
}

export async function logoutAllDevicesAction() {
  try {
    const user = await requireAuth();

    await activityLogService.log({
      userId: user.id,
      userName: user.fullName ?? user.email,
      action: "logout_all",
      resource: "auth",
      description: "Logged out from all devices",
    });

    await securityService.logoutAllDevices();
    return { success: true, error: null };
  } catch (e) {
    return { success: false, error: parseError(e) };
  }
}

export async function getLoginHistoryAction() {
  try {
    const user = await requireAuth();
    const data = await securityService.getLoginHistory(user.id, 20);
    return { success: true, data, error: null };
  } catch (e) {
    return { success: false, data: null, error: parseError(e) };
  }
}
