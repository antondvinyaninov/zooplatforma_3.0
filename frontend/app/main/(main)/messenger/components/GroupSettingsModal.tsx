import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Chat, User } from '../types';
import { getMediaUrl } from '@/lib/utils';
import { getUserAvatarUrl } from '@/lib/urls';

interface ChatParticipant extends User {
  role: string;
  joined_at: string;
}

interface GroupSettingsModalProps {
  chat: Chat;
  currentUserId: number;
  onClose: () => void;
  onUpdate: () => void; // Triggered when chat name leaves/changes
}

export default function GroupSettingsModal({ chat, currentUserId, onClose, onUpdate }: GroupSettingsModalProps) {
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [groupName, setGroupName] = useState(chat.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [isAddingParticipant, setIsAddingParticipant] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [copiedLink, setCopiedLink] = useState(false);

  const isAdmin = participants.some(p => p.id === currentUserId && p.role === 'admin');

  useEffect(() => {
    fetchParticipants();
  }, [chat.id]);

  const fetchParticipants = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<ChatParticipant[]>(`/api/chats/${chat.id}/participants`);
      if (res.success && res.data) {
        setParticipants(res.data);
      }
    } catch (e) {
      console.error('Failed to load participants', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAddingParticipant) return;

    const fetchUsers = async () => {
      setIsSearching(true);
      try {
        if (searchQuery.trim().length >= 2) {
          const res = await apiClient.get<any>(`/api/users?q=${encodeURIComponent(searchQuery)}`);
          if (res.success && res.data) {
            setSearchResults(res.data.filter((u: any) => !participants.some(p => p.id === u.id)));
          }
        } else {
          const res = await apiClient.get<any>('/api/friends');
          if (res.success && res.data) {
            setSearchResults(res.data.map((item: any) => item.friend).filter((u: any) => !participants.some(p => p.id === u.id)));
          }
        }
      } catch (e) {
        console.error('Failed to load users', e);
      } finally {
        setIsSearching(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, isAddingParticipant, participants]);

  const handleUpdateGroup = async () => {
    if (groupName.trim() === chat.name || groupName.trim() === '') {
      setIsEditing(false);
      return;
    }
    
    setIsSaving(true);
    try {
      const res = await apiClient.put(`/api/chats/${chat.id}`, { name: groupName.trim() });
      if (res.success) {
        onUpdate();
        setIsEditing(false);
      }
    } catch (e) {
      console.error('Failed to update group name', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('Вы уверены, что хотите выйти из группы?')) return;
    
    try {
      const res = await apiClient.delete(`/api/chats/${chat.id}/participants/${currentUserId}`);
      if (res.success) {
        onUpdate(); // Should trigger a re-fetch of chats and closing the current chat
        onClose();
      }
    } catch (e) {
      console.error('Failed to leave group', e);
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить группу? Это действие нельзя отменить.')) return;
    
    try {
      const res = await apiClient.delete(`/api/chats/${chat.id}`);
      if (res.success) {
        onUpdate(); // Should trigger a re-fetch of chats and closing the current chat
        onClose();
      }
    } catch (e) {
      console.error('Failed to delete group', e);
    }
  };

  const handleAddParticipant = async (userId: number) => {
    try {
      const res = await apiClient.post(`/api/chats/${chat.id}/participants`, { user_id: userId });
      if (res.success) {
        setIsAddingParticipant(false);
        setSearchQuery('');
        fetchParticipants(); // Refresh list immediately
        onUpdate(); // Trigger parent refresh (for participants count on header)
      }
    } catch (e) {
      console.error('Failed to add participant', e);
      alert('Ошибка при добавлении пользователя');
    }
  };

  const handleCopyInviteLink = async () => {
    try {
      const res = await apiClient.get<any>(`/api/chats/${chat.id}/invite`);
      if (res.success && res.data?.token) {
        const link = `${window.location.origin}/main/join/${res.data.token}`;
        await navigator.clipboard.writeText(link);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else {
        throw new Error("Не удалось получить токен");
      }
    } catch (e) {
      console.error('Failed to get invite link', e);
      alert('Ошибка при генерации ссылки-приглашения');
    }
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('media_type', 'photo');

      const mediaRes = await apiClient.post<any>('/api/media/upload', formData);
      
      if (!mediaRes.success) {
        alert("Ошибка сервера: " + (mediaRes.error || "Неизвестная ошибка"));
        return;
      }
      
      if (mediaRes.success && mediaRes.data?.file_name) {
        const updateRes = await apiClient.put(`/api/chats/${chat.id}`, { avatar_url: mediaRes.data.file_name });
        if (updateRes.success) {
          onUpdate(); // Trigger parent refresh to reload chat data
        }
      }
    } catch (err) {
      console.error('Failed to upload avatar', err);
      alert("Ошибка при загрузке: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Настройки группы</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="overflow-y-auto p-4 flex-1">
          {/* Avatar and Info */}
          <div className="flex flex-col items-center mb-6">
            <label className="relative w-24 h-24 mb-4 rounded-full bg-purple-500 flex items-center justify-center text-white text-3xl font-semibold overflow-hidden shadow-sm group cursor-pointer">
              {chat.avatar_url ? (
                <img src={getMediaUrl(chat.avatar_url)} alt={chat.name} className={`w-full h-full object-cover ${isUploadingAvatar ? 'opacity-50' : ''}`} />
              ) : (
                <span className={isUploadingAvatar ? 'opacity-50' : ''}>{chat.name?.[0]?.toUpperCase() || 'Г'}</span>
              )}
              
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                {isUploadingAvatar ? (
                  <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-white drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                )}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} disabled={isUploadingAvatar} />
            </label>
            
            {isEditing ? (
              <div className="flex items-center gap-2 w-full max-w-xs">
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="flex-1 w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button 
                  onClick={handleUpdateGroup}
                  disabled={isSaving}
                  className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2" onClick={() => setIsEditing(true)}>
                <h3 className="text-xl font-bold text-gray-900 text-center">{chat.name}</h3>
                <button className="p-1 text-gray-400 hover:text-blue-500 rounded-md">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
              </div>
            )}
            <p className="text-sm text-gray-500 mt-1">{participants.length} участника(ов)</p>
          </div>

          {/* Participants List */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Участники</h4>
              <button 
                onClick={() => setIsAddingParticipant(!isAddingParticipant)} 
                className="text-blue-500 hover:text-blue-600 font-medium text-sm transition-colors flex items-center gap-1"
              >
                {isAddingParticipant ? 'Отмена' : '+ Добавить'}
              </button>
            </div>
            
            {isAddingParticipant && (
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-3 mb-3 flex flex-col gap-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по имени..."
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  autoFocus
                />
                <div className="max-h-48 overflow-y-auto divide-y divide-gray-100">
                  {isSearching ? (
                    <div className="p-3 text-center text-xs text-gray-500">Поиск...</div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-3 text-center text-xs text-gray-500">Нет доступных пользователей</div>
                  ) : (
                    searchResults.map(user => (
                      <div key={user.id} className="flex items-center justify-between py-2 px-1 hover:bg-gray-100/50 rounded-lg group transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold overflow-hidden text-sm">
                            {user.avatar ? (
                              <img src={getUserAvatarUrl(user.avatar)} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                              user.name?.[0]?.toUpperCase() || '?'
                            )}
                          </div>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user.name} {user.last_name}
                          </p>
                        </div>
                        <button 
                          onClick={() => handleAddParticipant(user.id)}
                          className="px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium text-xs rounded-lg transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100 cursor-pointer"
                        >
                          Добавить
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            
            <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100 divide-y divide-gray-100">
              {isLoading ? (
                <div className="p-4 text-center text-sm text-gray-500">Загрузка...</div>
              ) : participants.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">Нет участников</div>
              ) : (
                participants.map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-3 hover:bg-gray-100/50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold overflow-hidden relative">
                      {p.avatar ? (
                        <img src={getUserAvatarUrl(p.avatar)} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        p.name?.[0]?.toUpperCase() || '?'
                      )}
                      {p.is_online && (
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {p.name} {p.last_name} {p.id === currentUserId && <span className="text-gray-400 font-normal">(Вы)</span>}
                      </p>
                      <p className="text-xs text-blue-500">{p.role === 'admin' ? 'Создатель' : 'Участник'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
             <button
               onClick={handleCopyInviteLink}
               className="w-full py-3 px-4 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl font-medium transition-colors outline-none focus:ring-2 flex items-center justify-center gap-2"
             >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
               {copiedLink ? 'Скопировано!' : 'Скопировать ссылку-приглашение'}
             </button>
             <button
               onClick={isAdmin ? handleDeleteGroup : handleLeaveGroup}
               className="w-full py-3 px-4 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-medium transition-colors outline-none focus:ring-2 flex items-center justify-center gap-2"
             >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={isAdmin ? "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" : "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"} />
               </svg>
               {isAdmin ? 'Удалить группу' : 'Выйти из группы'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
