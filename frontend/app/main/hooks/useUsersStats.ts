import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

interface UsersStats {
  total: number;
  online: number;
  posts: number;
  likes: number;
  comments: number;
  pets_total?: number;
  pets_owner?: number;
  pets_curator?: number;
}

const defaultStats: UsersStats = {
  total: 0,
  online: 0,
  posts: 0,
  likes: 0,
  comments: 0,
  pets_total: 0,
  pets_owner: 0,
  pets_curator: 0,
};

export function useUsersStats(isAuthenticated: boolean = false) {
  const { data: stats = defaultStats, isLoading: loading } = useQuery({
    queryKey: ['usersStats'],
    queryFn: async () => {
      const response = await apiClient.get<UsersStats>('/api/users/stats');
      if (response.success && response.data) {
        return response.data;
      }
      return defaultStats;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // Кэшируем на 5 минут
    refetchInterval: 5 * 60 * 1000, // Автоматически запрашиваем раз в 5 минут
  });

  return { stats, loading };
}
