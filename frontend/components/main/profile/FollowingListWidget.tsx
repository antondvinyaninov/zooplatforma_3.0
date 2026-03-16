'use client';

import { useRouter } from 'next/navigation';
import { UserIcon } from '@heroicons/react/24/outline';
import { followersApi } from '@/lib/api';
import { getMediaUrl, getFullName } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import FriendSkeleton from './FriendSkeleton';

interface FollowingListWidgetProps {
  userId: number;
  limit?: number;
  onViewAll?: () => void;
}

export default function FollowingListWidget({ userId, limit = 6, onViewAll }: FollowingListWidgetProps) {
  const router = useRouter();
  const { isAuthenticated, user: currentUser, isLoading: isAuthLoading } = useAuth();

  const { data: followingData, isLoading: loading } = useQuery({
    queryKey: ['following', userId],
    queryFn: async () => {
      const result = await followersApi.getFollowing(userId);
      if (result.success && result.data) {
        return result.data.slice(0, limit);
      }
      return [];
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // Cache list for 5 minutes
  });

  const following = followingData || [];

  if (isAuthLoading || loading) {
    return (
      <div className="flex gap-4 p-2 overflow-hidden">
        <FriendSkeleton />
        <FriendSkeleton />
        <FriendSkeleton />
        <FriendSkeleton />
      </div>
    );
  }

  // Не показываем виджет для неавторизованных
  if (!isAuthenticated || !currentUser) {
    return null;
  }

  if (following.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-gray-500">
        <p>Нет подписок</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Подписки <span className="text-gray-500 text-sm font-normal">({following.length})</span>
        </h2>
        <button
          onClick={onViewAll}
          className="text-sm font-medium text-blue-500 hover:text-blue-600"
        >
          Все
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {following.map((follow) => (
          <div
            key={follow.id}
            onClick={() => router.push(`/id${follow.id}`)}
            className="cursor-pointer group"
          >
            <div className="aspect-square rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden mb-1 group-hover:opacity-90 transition-opacity relative">
              {follow.avatar ? (
                <img
                  src={getMediaUrl(follow.avatar) || ''}
                  alt={follow.name || ''}
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon className="w-8 h-8 text-gray-400" />
              )}
              {/* Статус онлайн индикатор */}
              <div
                className={`absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full border border-white flex-shrink-0 ${
                  follow.is_online ? 'bg-green-500' : 'bg-gray-400'
                }`}
              ></div>
            </div>
            <div className="text-xs text-gray-700 text-center truncate">
              {getFullName(follow.name || '', follow.last_name || '')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
