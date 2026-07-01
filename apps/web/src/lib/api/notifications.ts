import { apiRequest } from '../api-client';

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  isRead: boolean;
  createdAt: string;
  message: string | null;
  projectId: string | null;
}

export async function getNotifications(): Promise<NotificationItem[]> {
  return apiRequest<NotificationItem[]>('/notifications');
}

export async function getUnreadCount(): Promise<number> {
  const res = await apiRequest<{ unread: number }>('/notifications/count');
  return res.unread;
}

export async function markAsRead(id: string): Promise<void> {
  return apiRequest<void>(`/notifications/${id}/read`, { method: 'PATCH' });
}

export async function markAllAsRead(): Promise<void> {
  return apiRequest<void>('/notifications/read-all', { method: 'PATCH' });
}

export async function deleteNotification(id: string): Promise<void> {
  await apiRequest<unknown>(`/notifications/${id}`, { method: 'DELETE' });
}
