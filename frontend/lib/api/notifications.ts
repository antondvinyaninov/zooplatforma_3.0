import { apiClient } from './client';
import { Notification } from './types';

// API методы для уведомлений
export const notificationsApi = {
  // Получить список уведомлений
  getAll: (limit?: number) => {
    const params = limit ? `?limit=${limit}` : '';
    return apiClient.get<Notification[]>(`/api/notifications${params}`);
  },

  // Получить количество непрочитанных
  getUnreadCount: () => apiClient.get<{ count: number }>('/api/notifications/unread'),

  // Отметить уведомление как прочитанное
  markAsRead: (notificationId: number) =>
    apiClient.put<{ message: string }>(`/api/notifications/${notificationId}/read`, {}),

  // Отметить все как прочитанные
  markAllAsRead: () => apiClient.post<{ message: string }>('/api/notifications/mark-all-read', {}),
};
