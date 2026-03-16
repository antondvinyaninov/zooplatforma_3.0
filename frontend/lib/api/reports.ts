import { apiClient } from './client';

// API методы для жалоб
export const reportsApi = {
  // Создать жалобу
  create: (data: { entity_type: string; entity_id: number; reason: string; details?: string }) =>
    apiClient.post<{ id: number }>('/api/reports', data),
};
