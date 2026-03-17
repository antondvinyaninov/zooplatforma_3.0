import { apiClient, API_URL } from './client';
import { User, ApiResponse } from './types';

export const usersApi = {
  getAll: () => apiClient.get<User[]>('/api/users'),

  getById: (id: number) => apiClient.get<User>(`/api/users/${id}`),

  create: (user: Partial<User>) => apiClient.post<User>('/api/users', user),

  update: (id: number, user: Partial<User>) => apiClient.put<User>(`/api/users/${id}`, user),

  delete: (id: number) => apiClient.delete<{ message: string }>(`/api/users/${id}`),

  // Обновление своего профиля
  updateProfile: (data: {
    name?: string;
    last_name?: string;
    bio?: string;
    phone?: string;
    location?: string;
    profile_visibility?: string;
    show_phone?: string;
    show_email?: string;
    allow_messages?: string;
    show_online?: string;
  }) => apiClient.put<User>('/api/profile', data),

  // Загрузка аватара
  uploadAvatar: async (
    file: File,
  ): Promise<ApiResponse<{ avatar_url: string; message: string }>> => {
    try {
      // Импортируем функцию сжатия
      const { compressAvatarImage } = await import('../image-compression');

      // Сжимаем изображение
      const compressedFile = await compressAvatarImage(file);

      const formData = new FormData();
      formData.append('avatar', compressedFile);

      // Получаем токен из localStorage
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/profile/avatar`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Ошибка загрузки аватара',
        };
      }

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // Загрузка обложки
  uploadCover: async (file: File): Promise<ApiResponse<{ cover_url: string; message: string }>> => {
    try {
      // Импортируем функцию сжатия
      const { compressCoverImage } = await import('../image-compression');

      // Сжимаем изображение
      const compressedFile = await compressCoverImage(file);

      const formData = new FormData();
      formData.append('cover', compressedFile);

      // Получаем токен из localStorage
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/profile/cover`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Ошибка загрузки обложки',
        };
      }

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // Удаление аватара
  deleteAvatar: async (): Promise<ApiResponse<{ message: string }>> => {
    try {
      // Получаем токен из localStorage
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/profile/avatar/delete`, {
        method: 'DELETE',
        credentials: 'include',
        headers,
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Ошибка удаления аватара',
        };
      }

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // Удаление обложки
  deleteCover: async (): Promise<ApiResponse<{ message: string }>> => {
    try {
      // Получаем токен из localStorage
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/profile/cover/delete`, {
        method: 'DELETE',
        credentials: 'include',
        headers,
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Ошибка удаления обложки',
        };
      }

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  getSocialLinks: () =>
    apiClient.get<{
      vk: { linked: boolean; vk_id?: number };
      ok: { linked: boolean };
      mailru: { linked: boolean };
    }>('/api/profile/social-links'),

  linkVK: (data: {
    access_token: string;
    user_id: number;
    email?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    phone?: string;
  }) => apiClient.post<{ vk: { linked: boolean; vk_id: number } }>('/api/profile/social-links/vk/link', data),

  unlinkVK: () => apiClient.delete<{ vk: { linked: boolean } }>('/api/profile/social-links/vk'),
};

// API методы для профиля
export const profileApi = {
  update: (data: {
    bio?: string;
    phone?: string;
    location?: string;
    avatar?: string;
    cover_photo?: string;
  }) => apiClient.put<User>('/api/profile', data),
};
