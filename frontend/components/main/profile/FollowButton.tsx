'use client';

import { useState, useEffect } from 'react';
import { followersApi } from '@/lib/api';
import { UserPlusIcon, CheckIcon } from '@heroicons/react/24/outline';

interface FollowButtonProps {
  userId: number;
  currentUserId: number;
}

export default function FollowButton({ userId, currentUserId }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollower, setIsFollower] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    if (userId && currentUserId && userId !== currentUserId) {
      checkStatus();
    } else {
      setIsLoading(false);
    }
  }, [userId, currentUserId]);

  const checkStatus = async () => {
    try {
      const response = await followersApi.getStatus(userId);
      if (response.success && response.data) {
        setIsFollowing(response.data.is_following);
        setIsFollower(response.data.is_follower);
      }
    } catch (error) {
      console.error('Failed to check follow status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowClick = async () => {
    if (isActionLoading) return;
    setIsActionLoading(true);

    try {
      if (isFollowing) {
        // Отписаться
        const response = await followersApi.unfollow(userId);
        if (response.success) {
          setIsFollowing(false);
          // Идеально бы еще обновить счетчик подписчиков в кэше/стейче профиля
        }
      } else {
        // Подписаться
        const response = await followersApi.follow(userId);
        if (response.success) {
          setIsFollowing(true);
        }
      }
    } catch (error) {
      console.error('Failed to toggle follow status:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading || userId === currentUserId) return null;

  if (isFollowing) {
    return (
      <button
        onClick={handleFollowClick}
        disabled={isActionLoading}
        className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap border ${
          isActionLoading ? 'opacity-70 cursor-not-allowed' : ''
        } border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-red-500 hover:border-red-200 group`}
        title={isFollower ? 'Вы подписаны друг на друга' : 'Отписаться'}
      >
        <span className="group-hover:hidden flex items-center gap-1.5">
          <CheckIcon className="w-4 h-4 text-green-500" />
          <span className="hidden sm:inline">{isFollower ? 'Взаимно' : 'Вы подписаны'}</span>
          <span className="sm:hidden">Подписка</span>
        </span>
        <span className="hidden group-hover:flex items-center gap-1.5 text-red-500">
          <span className="hidden sm:inline">Отписаться</span>
          <span className="sm:hidden">Отписаться</span>
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={handleFollowClick}
      disabled={isActionLoading}
      className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors whitespace-nowrap ${
        isActionLoading ? 'opacity-70 cursor-not-allowed' : ''
      }`}
      style={{ backgroundColor: '#1B76FF' }}
    >
      <UserPlusIcon className="w-4 h-4" />
      <span className="hidden sm:inline">{isFollower ? 'Подписаться в ответ' : 'Подписаться'}</span>
      <span className="sm:hidden">Подписаться</span>
    </button>
  );
}
