'use client';

import { Chat } from '../types';
import { getMediaUrl } from '@/lib/utils';
import { getUserAvatarUrl } from '@/lib/urls';

interface ChatHeaderProps {
  chat: Chat | null;
  onClose: () => void;
  onOpenSettings?: () => void;
  onDelete?: () => void;
}

export default function ChatHeader({ chat, onClose, onOpenSettings, onDelete }: ChatHeaderProps) {
  if (!chat) return null;

  const isGroup = chat.type === 'group';
  const user = chat.other_user;
  const chatName = isGroup 
    ? (chat.name || 'Назовите группу') 
    : ((user?.name || user?.last_name) 
        ? `${user?.name || ''} ${user?.last_name || ''}`.trim() 
        : 'Неизвестный пользователь');
  const avatarUrl = isGroup 
    ? (chat.avatar_url ? getMediaUrl(chat.avatar_url) : '') 
    : (user?.avatar ? getUserAvatarUrl(user.avatar) : '');
  const fallbackLetter = isGroup 
    ? (chat.name?.[0]?.toUpperCase() || 'Г') 
    : (user?.name?.[0]?.toUpperCase() || '?');

  const getLastSeenText = (lastSeen?: string) => {
    if (!lastSeen) return 'не в сети';

    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - lastSeenDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'был(а) только что';
    if (diffMins < 60) return `был(а) ${diffMins} мин. назад`;
    if (diffHours < 24) return `был(а) ${diffHours} ч. назад`;
    if (diffDays === 1) return 'был(а) вчера';
    if (diffDays < 7) return `был(а) ${diffDays} дн. назад`;
    return `был(а) ${lastSeenDate.toLocaleDateString('ru-RU')}`;
  };

  return (
    <div className="bg-white/85 backdrop-blur-md border-b border-gray-100 px-3 py-2.5 flex items-center justify-between shadow-sm z-20 sticky top-0">
      <div className="flex items-center gap-1.5">
        <div className="relative flex items-center">
          <button
            onClick={onClose}
            className="p-1.5 -ml-1.5 hover:bg-gray-100 rounded-full transition-colors md:mr-0 z-10 relative flex items-center justify-center"
            title="Назад к чатам"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#818c99]">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 18L5.5 12L12 6M18 18L11.5 12L18 6" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2.5 ml-5">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={chatName}
              className="w-[38px] h-[38px] rounded-full object-cover"
            />
          ) : (
            <div className={`w-[38px] h-[38px] rounded-full ${isGroup ? 'bg-purple-500' : 'bg-blue-500'} flex items-center justify-center text-white font-semibold`}>
              {fallbackLetter}
            </div>
          )}

          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <h3 className="font-semibold text-[16px] text-[#2c2d2e] tracking-tight leading-tight">
                {chatName}
              </h3>
              {!isGroup && (user as any)?.verified && (
                <svg className="w-[14px] h-[14px] text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              )}
            </div>
            {!isGroup && user && (
              <p className="text-[13px] text-[#818c99] font-normal leading-tight mt-[1px]">
                {user.is_online ? <span className="text-[#2688eb]">онлайн</span> : getLastSeenText(user.last_seen)}
              </p>
            )}
            {isGroup && (
              <p className="text-[13px] text-[#818c99] font-normal leading-tight mt-[1px]">
                Группа • {chat.participants_count || 1} участников
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {isGroup && onOpenSettings && (
          <button 
            onClick={onOpenSettings}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            title="Настройки чата"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        )}
        {!isGroup && onDelete && (
          <button 
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
            title="Удалить переписку"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
