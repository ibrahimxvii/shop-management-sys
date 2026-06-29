import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSettingsAction,
  updateSettingsAction,
  getUserPreferencesAction,
  updateUserPreferencesAction,
} from "@/app/actions/settings.actions";
import type { ShopSettingsValues } from "@/lib/validations/settings";
import type { UserPreferencesValues } from "@/lib/validations/settings";

const SETTINGS_KEY = ["settings"];
const USER_PREFS_KEY = ["user-preferences"];

export function useSettings() {
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: async () => {
      const result = await getSettingsAction();
      if (!result.success || !result.data) {
        throw new Error(result.error ?? "Failed to load settings");
      }
      return result.data;
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: ShopSettingsValues) => updateSettingsAction(values),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: SETTINGS_KEY }),
  });
}

export function useUserPreferences() {
  return useQuery({
    queryKey: USER_PREFS_KEY,
    queryFn: async () => {
      const result = await getUserPreferencesAction();
      if (!result.success) {
        throw new Error(result.error ?? "Failed to load preferences");
      }
      return result.data;
    },
  });
}

export function useUpdateUserPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: UserPreferencesValues) =>
      updateUserPreferencesAction(values),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: USER_PREFS_KEY }),
  });
}
