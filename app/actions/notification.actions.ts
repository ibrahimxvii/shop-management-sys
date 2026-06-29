"use server";

import { revalidatePath } from "next/cache";
import { notificationService } from "@/services/notification.service";
import { parseError } from "@/lib/errors";
import type { NotificationFilters } from "@/types/notifications";

export async function getNotificationsAction(filters?: NotificationFilters) {
  try {
    const notifications = await notificationService.getNotifications(filters);
    return { success: true, data: notifications, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

export async function getUnreadCountAction() {
  try {
    const count = await notificationService.getUnreadCount();
    return { success: true, data: count, error: null };
  } catch (error) {
    return { success: false, data: 0, error: parseError(error) };
  }
}

export async function markNotificationReadAction(id: string) {
  try {
    await notificationService.markAsRead(id);
    revalidatePath("/notifications");
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: parseError(error) };
  }
}

export async function markAllNotificationsReadAction() {
  try {
    await notificationService.markAllAsRead();
    revalidatePath("/notifications");
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: parseError(error) };
  }
}

export async function deleteNotificationAction(id: string) {
  try {
    await notificationService.deleteNotification(id);
    revalidatePath("/notifications");
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: parseError(error) };
  }
}

export async function deleteAllReadNotificationsAction() {
  try {
    await notificationService.deleteAllRead();
    revalidatePath("/notifications");
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: parseError(error) };
  }
}
