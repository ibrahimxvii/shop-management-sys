export type NotificationType =
  | "low_stock"
  | "new_order"
  | "cancelled_order"
  | "refund_request"
  | "system";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  related_id: string | null;
  related_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationFilters {
  read?: boolean;
  type?: NotificationType;
  limit?: number;
  offset?: number;
}
