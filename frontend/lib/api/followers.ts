import { apiClient } from './client';

export interface FollowerUser {
  id: number;
  name?: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  location?: string;
  is_online?: boolean;
  followed_at?: string;
}

export interface FollowStatus {
  is_following: boolean; // Я подписан на него
  is_follower: boolean;  // Он подписан на меня
}

export const followersApi = {
  // Подписаться
  follow: (userId: number) => apiClient.post<{ message: string }>(`/api/users/${userId}/follow`, {}),

  // Отписаться
  unfollow: (userId: number) => apiClient.post<{ message: string }>(`/api/users/${userId}/unfollow`, {}),

  // Получить список подписчиков
  getFollowers: (userId: number) => apiClient.get<FollowerUser[]>(`/api/users/${userId}/followers`),

  // Получить список подписок
  getFollowing: (userId: number) => apiClient.get<FollowerUser[]>(`/api/users/${userId}/following`),

  // Получить статус подписки
  getStatus: (userId: number) => apiClient.get<FollowStatus>(`/api/users/${userId}/follow_status`),
};
