'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, UserIcon } from '@heroicons/react/24/outline';
import { friendsApi, followersApi, User } from '@/lib/api';
import { getMediaUrl, getFullName } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import FriendButton from './FriendButton';
import FollowButton from './FollowButton';

type TabType = 'friends' | 'followers' | 'following';

interface ConnectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  currentUserId: number | undefined;
  initialTab?: TabType;
}

export default function ConnectionsModal({
  isOpen,
  onClose,
  userId,
  currentUserId,
  initialTab = 'friends',
}: ConnectionsModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      loadData(initialTab);
    }
  }, [isOpen, initialTab, userId]);

  const loadData = async (tab: TabType) => {
    setLoading(true);
    setUsers([]);
    try {
      if (tab === 'friends') {
        const res = await friendsApi.getUserFriends(userId);
        if (res.success && res.data) {
          // friendsApi.getUserFriends returns Friendship objects (friend: User)
          setUsers(res.data.map(f => f.friend));
        }
      } else if (tab === 'followers') {
        const res = await followersApi.getFollowers(userId);
        if (res.success && res.data) {
          // followersApi returns User objects directly
          setUsers(res.data);
        }
      } else if (tab === 'following') {
        const res = await followersApi.getFollowing(userId);
        if (res.success && res.data) {
          setUsers(res.data);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    loadData(tab);
  };

  const navigateToUser = (id: number) => {
    onClose();
    router.push(`/id${id}`);
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <Dialog.Title className="text-lg font-bold text-gray-900">Контакты</Dialog.Title>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex px-4 border-b border-gray-100">
            {[
              { id: 'friends', label: 'Друзья' },
              { id: 'followers', label: 'Подписчики' },
              { id: 'following', label: 'Подписки' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as TabType)}
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="p-2 overflow-y-auto flex-1 bg-gray-50/50">
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                Спиcок пуст
              </div>
            ) : (
              <div className="space-y-2">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100">
                    <div 
                      className="flex items-center gap-3 cursor-pointer group flex-1"
                      onClick={() => navigateToUser(u.id)}
                    >
                      <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden relative flex-shrink-0">
                        {u.avatar ? (
                          <img src={getMediaUrl(u.avatar) || ''} alt={u.name || ''} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <UserIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        {u.is_online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      <div className="overflow-hidden pr-2">
                        <div className="font-medium text-gray-900 truncate group-hover:text-blue-500 transition-colors">
                          {getFullName(u.name || '', u.last_name || '')}
                        </div>
                        {u.location && (
                          <div className="text-xs text-gray-500 truncate">{u.location}</div>
                        )}
                      </div>
                    </div>
                    
                    {/* Action buttons if not viewing oneself */}
                    {currentUserId && currentUserId !== u.id && (
                      <div className="flex-shrink-0 scale-90 origin-right">
                        <FollowButton userId={u.id} currentUserId={currentUserId} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
