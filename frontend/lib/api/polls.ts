import { apiClient } from './client';
import { Poll } from './types';

// API методы для опросов
export const pollsApi = {
  // Получить опрос для поста
  getByPostId: (postId: number) => apiClient.get<Poll>(`/api/polls/post/${postId}`),

  // Проголосовать в опросе
  vote: (pollId: number, optionIds: number[]) =>
    apiClient.post<Poll>(`/api/polls/${pollId}/vote`, { option_ids: optionIds }),

  // Удалить свой голос
  deleteVote: (pollId: number) =>
    apiClient.delete<{ message: string }>(`/api/polls/${pollId}/vote`),
};
