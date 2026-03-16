import { useQuery } from '@tanstack/react-query';
import { petsApi } from '@/lib/api/pets';

// Ключи запросов (query keys) - хорошая практика хранить их в константах
// или фабриках, чтобы точно знать, как инвалидировать кеш
export const petsKeys = {
  all: ['pets'] as const,
  userPets: (userId: number) => [...petsKeys.all, 'user', userId] as const,
  curatedPets: (userId: number) => [...petsKeys.all, 'curated', userId] as const,
};

/**
 * Хук для получения питомцев конкретного пользователя.
 * @param userId - ID пользователя
 * @param enabled - опциональный флаг для отложенного запуска (например, пока ID не загружен)
 */
export function useUserPets(userId: number, enabled = true) {
  return useQuery({
    queryKey: petsKeys.userPets(userId),
    queryFn: async () => {
      const response = await petsApi.getUserPets(userId);
      if (!response.success) {
        throw new Error(response.error || 'Ошибка при загрузке питомцев');
      }
      return response.data || [];
    },
    // Запрос выполнится только если enabled === true и есть userId
    enabled: enabled && !!userId,
  });
}

/**
 * Хук для получения курируемых питомцев пользователя.
 */
export function useCuratedPets(userId: number, enabled = true) {
  return useQuery({
    queryKey: petsKeys.curatedPets(userId),
    queryFn: async () => {
      const response = await petsApi.getCuratedPets(userId);
      if (!response.success) {
        throw new Error(response.error || 'Ошибка при загрузке курируемых питомцев');
      }
      return response.data || [];
    },
    enabled: enabled && !!userId,
  });
}
