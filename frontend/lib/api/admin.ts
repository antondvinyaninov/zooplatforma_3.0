import { apiClient } from './client';

// API методы для админки - активность
export const adminActivityApi = {
  // Получить общую статистику активности
  getStats: () =>
    apiClient.get<{
      online_now: number;
      active_last_hour: number;
      active_last_24h: number;
    }>('/api/admin/activity/stats'),

  // Получить логи активности пользователей
  getUserActivityLogs: (params?: {
    user_id?: number;
    action_type?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.user_id) queryParams.append('user_id', params.user_id.toString());
    if (params?.action_type) queryParams.append('action_type', params.action_type);
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    const queryString = queryParams.toString();
    return apiClient.get<any[]>(`/api/admin/user-activity${queryString ? `?${queryString}` : ''}`);
  },

  // Получить статистику активности пользователей
  getUserActivityStats: () => apiClient.get<any>('/api/admin/user-activity/stats'),

  // Получить активность конкретного пользователя
  getUserActivityByUserId: (userId: number, limit?: number) => {
    const queryString = limit ? `?limit=${limit}` : '';
    return apiClient.get<any[]>(`/api/admin/user-activity/user/${userId}${queryString}`);
  },

  // Получить логи действий администраторов
  getAdminLogs: (limit?: number) => {
    const queryString = limit ? `?limit=${limit}` : '';
    return apiClient.get<any[]>(`/api/admin/logs${queryString}`);
  },

  // Получить статистику логов администраторов
  getAdminLogsStats: () => apiClient.get<any>('/api/admin/logs/stats'),
};
