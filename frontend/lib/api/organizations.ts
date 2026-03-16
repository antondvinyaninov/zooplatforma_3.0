import { apiClient } from './client';
import { Organization, CreateOrganizationRequest } from './types';

// API методы для организаций
export const organizationsApi = {
  // Получить все организации
  getAll: () => apiClient.get<Organization[]>('/api/organizations/all'),

  // Получить организацию по ID
  getById: (id: number) => apiClient.get<Organization>(`/api/organizations/${id}`),

  // Создать организацию
  create: (data: CreateOrganizationRequest) =>
    apiClient.post<{ id: number }>('/api/organizations', data),

  // Обновить организацию
  update: (id: number, data: Partial<CreateOrganizationRequest>) =>
    apiClient.put<{ message: string }>(`/api/organizations/${id}`, data),

  // Удалить организацию
  delete: (id: number) => apiClient.delete<{ message: string }>(`/api/organizations/${id}`),

  // Получить организации пользователя
  getUserOrganizations: (userId: number) =>
    apiClient.get<Organization[]>(`/api/organizations/user/${userId}`),

  // Получить участников организации
  getMembers: (organizationId: number) =>
    apiClient.get<any[]>(`/api/organizations/members/${organizationId}`),

  // Добавить участника
  addMember: (organizationId: number, userId: number, role: string, position?: string) =>
    apiClient.post<{ message: string }>('/api/organizations/members/add', {
      organization_id: organizationId,
      user_id: userId,
      role,
      position: position || '',
    }),

  // Обновить участника
  updateMember: (memberId: number, role: string, position?: string) =>
    apiClient.put<{ message: string }>('/api/organizations/members/update', {
      member_id: memberId,
      role,
      position: position || '',
    }),

  // Удалить участника
  removeMember: (memberId: number) =>
    apiClient.delete<{ message: string }>('/api/organizations/members/remove', {
      member_id: memberId,
    }),
};
