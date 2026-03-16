import { apiClient } from './client';
import { Friendship, FriendshipStatus } from './types';

// API методы для друзей
export const friendsApi = {
  // Получить список друзей
  getFriends: () => apiClient.get<Friendship[]>('/api/friends'),

  // Получить список друзей конкретного пользователя
  getUserFriends: (userId: number) => apiClient.get<Friendship[]>(`/api/friends/user/${userId}`),

  // Получить входящие запросы в друзья
  getRequests: () => apiClient.get<Friendship[]>('/api/friends/requests'),

  // Получить статус дружбы с пользователем
  getStatus: (userId: number) => apiClient.get<FriendshipStatus>(`/api/friends/status/${userId}`),

  // Отправить запрос в друзья
  sendRequest: (friendId: number) =>
    apiClient.post<{ message: string }>('/api/friends/request', { friend_id: friendId }),

  // Принять запрос в друзья
  acceptRequest: (friendId: number) =>
    apiClient.post<{ message: string }>('/api/friends/accept', { friend_id: friendId }),

  // Отклонить запрос в друзья
  rejectRequest: (friendId: number) =>
    apiClient.post<{ message: string }>('/api/friends/reject', { friend_id: friendId }),

  // Удалить из друзей
  removeFriend: (friendId: number) =>
    apiClient.delete<{ message: string }>('/api/friends/remove', { friend_id: friendId }),
};
