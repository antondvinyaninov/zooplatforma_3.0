import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { User, Chat } from '../types';
import { getUserAvatarUrl } from '@/lib/urls';

interface CreateGroupModalProps {
  onClose: () => void;
  onSuccess: (chatId: number) => void;
}

export default function CreateGroupModal({ onClose, onSuccess }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState('');
  const [friends, setFriends] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        if (searchQuery.trim().length >= 2) {
          // Search all users
          const res = await apiClient.get<any>(`/api/users?q=${encodeURIComponent(searchQuery)}`);
          if (res.success && res.data) {
            setFriends(res.data);
          }
        } else {
          // Default to friends if query is empty or too short
          const res = await apiClient.get<any>('/api/friends');
          if (res.success && res.data) {
            setFriends(res.data.map((item: any) => item.friend));
          }
        }
      } catch (e) {
        console.error('Failed to load users', e);
      } finally {
        setIsLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const toggleUser = (userId: number) => {
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUserIds(newSelected);
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selectedUserIds.size === 0) return;
    setIsSubmitting(true);
    try {
      const response = await apiClient.post<any>('/api/chats/group', {
        name: groupName.trim(),
        participants: Array.from(selectedUserIds)
      });
      if (response.success && response.data?.id) {
        onSuccess(response.data.id);
      }
    } catch (e) {
      console.error('Failed to create group', e);
      alert('Ошибка при создании группы');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Создать группу</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5">
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center">
              Название группы <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Введите название"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              autoFocus
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Участники (выбрано: {selectedUserIds.size})
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск пользователей по имени..."
              className="w-full px-4 py-2.5 mb-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <div className="h-64 overflow-y-auto border border-gray-100 rounded-xl bg-gray-50">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              ) : friends.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-gray-500 p-4 text-center">
                  Пользователи не найдены
                </div>
              ) : (
                <div className="divide-y divide-gray-100 p-1">
                  {friends.map((friend) => (
                    <label
                      key={friend.id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUserIds.has(friend.id)}
                        onChange={() => toggleUser(friend.id)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold overflow-hidden">
                        {friend.avatar ? (
                          <img src={getUserAvatarUrl(friend.avatar)} alt={friend.name} className="w-full h-full object-cover" />
                        ) : (
                          friend.name?.[0]?.toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {friend.name} {friend.last_name}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleCreate}
            disabled={!groupName.trim() || selectedUserIds.size === 0 || isSubmitting}
            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center shadow-sm"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Создание...
              </>
            ) : (
              'Создать группу'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
