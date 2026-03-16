import { apiClient } from './client';
import { Announcement } from './types';

// API методы для объявлений
export const announcementsApi = {
  // Получить список объявлений
  getAll: (params?: { limit?: number; offset?: number; category?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.category) queryParams.append('category', params.category);
    const queryString = queryParams.toString();
    return apiClient.get<Announcement[]>(
      `/api/announcements${queryString ? `?${queryString}` : ''}`,
    );
  },

  // Получить объявление по ID
  getById: (id: number) => apiClient.get<Announcement>(`/api/announcements/${id}`),

  // Создать объявление
  create: (data: {
    title: string;
    description: string;
    category: string;
    price?: number;
    location?: string;
    contact_phone?: string;
    contact_email?: string;
  }) => apiClient.post<{ id: number }>('/api/announcements', data),

  // Обновить объявление
  update: (
    id: number,
    data: {
      title?: string;
      description?: string;
      category?: string;
      price?: number;
      location?: string;
      contact_phone?: string;
      contact_email?: string;
      status?: string;
    },
  ) => apiClient.put<{ message: string }>(`/api/announcements/${id}`, data),

  // Удалить объявление
  delete: (id: number) => apiClient.delete<{ message: string }>(`/api/announcements/${id}`),
};
