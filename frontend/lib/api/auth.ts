import { apiClient } from './client';
import { User } from './types';

// API методы для авторизации (используют тот же клиент что и остальные запросы)
export const authApi = {
  register: (name: string, email: string, password: string) =>
    apiClient.post<{ user: User }>('/api/auth/register', { name, email, password }),

  login: (email: string, password: string) =>
    apiClient.post<{ user: User }>('/api/auth/login', { email, password }),

  logout: () => apiClient.post<{ message: string }>('/api/auth/logout', {}),

  me: () => apiClient.get<User>('/api/auth/me'),

  updateEmail: (email: string) => 
    apiClient.post<{ message: string, token: string; merge_required?: boolean }>('/api/auth/update-email', { email }),

  mergeRequest: (email: string) =>
    apiClient.post<{ message: string }>('/api/auth/merge-request', { email }),

  mergeConfirm: (email: string, code: string) =>
    apiClient.post<{ message: string, token: string }>('/api/auth/merge-confirm', { email, code }),
};
