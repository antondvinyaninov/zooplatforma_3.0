'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserIcon } from '@heroicons/react/24/outline';
import { friendsApi } from '@/lib/api';
import { getMediaUrl, getFullName } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import FriendSkeleton from './FriendSkeleton';

interface FriendsListWidgetProps {
  userId: number;
  limit?: number;
  onViewAll?: () => void;
}

export default function FriendsListWidget({ userId, limit = 6, onViewAll }: FriendsListWidgetProps) {
  const router = useRouter();
  const { isAuthenticated, user: currentUser, isLoading: isAuthLoading } = useAuth();

  const { data: friendsData, isLoading: loading } = useQuery({
    queryKey: ['friends', userId],
    queryFn: async () => {
      const result = await friendsApi.getUserFriends(userId);
      if (result.success && result.data) {
        return result.data.slice(0, limit);
      }
      return [];
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // Cache friends list for 5 minutes
  });

  const friends = friendsData || [];

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

  if (friends.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-gray-500">
        <p>Нет друзей</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[16px] font-bold text-gray-900 flex items-center gap-2">
          Друзья <span className="text-gray-500 text-[13px] font-bold bg-gray-100 px-2.5 py-0.5 rounded-full">{friends.length}</span>
        </h2>
        <button
          onClick={onViewAll}
          className="text-[13px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50/50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-all duration-300"
        >
          Все
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {friends.map((friendship) => (
          <div
            key={friendship.id}
            onClick={() => router.push(`/id${friendship.friend.id}`)}
            className="cursor-pointer group flex flex-col items-center"
          >
            <div className="aspect-square w-full rounded-[16px] bg-gray-50 flex items-center justify-center overflow-hidden mb-2 shadow-sm border border-gray-100 group-hover:shadow-md group-hover:-translate-y-0.5 transition-all duration-300 relative">
              {friendship.friend.avatar ? (
                <img
                  src={getMediaUrl(friendship.friend.avatar) || ''}
                  alt={friendship.friend.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon className="w-8 h-8 text-gray-300" strokeWidth={1.5} />
              )}
              {/* Статус онлайн индикатор */}
              <div
                className={`absolute bottom-1 right-1 w-3 h-3 rounded-full border-2 border-white flex-shrink-0 ${
                  friendship.friend.is_online ? 'bg-green-500' : 'bg-gray-300'
                }`}
              ></div>
            </div>
            <div className="text-[12px] font-medium text-gray-700 text-center truncate w-full px-1">
              {getFullName(friendship.friend.name, friendship.friend.last_name)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
