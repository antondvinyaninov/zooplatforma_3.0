'use client';

import { User, Chat } from '../types';
import { getUserAvatarUrl } from '@/lib/urls';

interface ChatListProps {
  chats: Chat[];
  loading: boolean;
  isCollapsed: boolean;
  selectedChatId: number | null;
  currentUserId?: number;
  onToggleCollapse: () => void;
  onSelectChat: (chatId: number) => void;
}

export default function ChatList({
  chats,
  loading,
  isCollapsed,
  selectedChatId,
  currentUserId,
  onToggleCollapse,
  onSelectChat,
}: ChatListProps) {
  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Вчера';
    } else if (days < 7) {
      return date.toLocaleDateString('ru-RU', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    }
  };

  return (
    <div
      className={`${
        selectedChatId ? 'hidden md:flex' : 'flex'
      } ${isCollapsed ? 'md:w-[70px]' : 'w-full md:w-[340px]'} border-r border-gray-200 flex-col transition-all duration-300`}
    >
      {/* Шапка */}
      <div className="p-4 pb-2 border-b border-gray-200">
        <div
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-4`}
        >
          {!isCollapsed && <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Чаты</h2>}
          
          {/* Иконки действий в шапке */}
          <button
            onClick={onToggleCollapse}
            className="hidden md:block p-2 hover:bg-gray-100 rounded-full transition-colors"
            title={isCollapsed ? 'Развернуть' : 'Свернуть'}
          >
            <svg
              className={`w-5 h-5 text-gray-600 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Поиск */}
        {!isCollapsed && (
          <div className="relative mb-3">
            <svg
              className="absolute left-3 top-1/2 -translate-y-[45%] w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Поиск"
              className="w-full pl-10 pr-4 py-[6px] bg-[#f0f2f5] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-[15px] placeholder-gray-500 font-normal"
            />
          </div>
        )}
        
      </div>

      {/* Список чатов */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : chats.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <svg
                className="w-16 h-16 mx-auto mb-2 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              {!isCollapsed && <p className="text-sm">Нет чатов</p>}
            </div>
          </div>
        ) : (
          chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className={`w-full ${isCollapsed ? 'p-2' : 'p-3'} flex ${isCollapsed ? 'justify-center' : 'items-start gap-3'} hover:bg-gray-50 transition-colors border-b border-gray-100 ${selectedChatId === chat.id ? 'bg-blue-50' : ''}`}
              title={isCollapsed ? `${chat.other_user?.name} ${chat.other_user?.last_name}` : ''}
            >
              {/* Аватар */}
              <div className="relative flex-shrink-0">
                {chat.other_user?.avatar ? (
                  <img
                    src={getUserAvatarUrl(chat.other_user.avatar)}
                    alt={chat.other_user.name}
                    className={`${isCollapsed ? 'w-12 h-12' : 'w-14 h-14'} rounded-full object-cover`}
                  />
                ) : (
                  <div
                    className={`${isCollapsed ? 'w-12 h-12' : 'w-14 h-14'} rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-lg`}
                  >
                    {chat.other_user?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                {/* Индикатор онлайна на аватаре */}
                {chat.other_user?.is_online && (
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                )}
              </div>

              {/* Информация - только в развернутом виде */}
              {!isCollapsed && (
                <div className="flex-1 min-w-0 pr-1 text-left flex flex-col justify-center">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="font-semibold text-[16px] text-gray-900 truncate">
                        {chat.other_user?.name} {chat.other_user?.last_name}
                      </span>
                      {(chat.other_user as any)?.verified && (
                         <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                         </svg>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-0.5">
                    <div className="flex items-center gap-1.5 min-w-0 overflow-hidden flex-1">
                      {chat.last_message && (
                        <p className={`text-[14px] truncate ${chat.unread_count > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                          {chat.last_message.sender_id === currentUserId && <span className="text-gray-500">Вы: </span>}
                          {(() => {
                            try {
                              if (chat.last_message.content && chat.last_message.content.startsWith('{')) {
                                const parsed = JSON.parse(chat.last_message.content);
                                if (parsed.type === 'pet') {
                                  return `🐾 ${parsed.name}`;
                                }
                              }
                            } catch (e) { }
                            return chat.last_message.content || '📎 Вложение';
                          })()}
                        </p>
                      )}
                      
                      {chat.last_message_at && (
                        <span className="text-[14px] text-gray-400 whitespace-nowrap flex-shrink-0 before:content-['·'] before:mr-1.5 before:text-gray-400">
                          {formatTime(chat.last_message_at)}
                        </span>
                      )}
                    </div>

                    {/* Badge */}
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                       {chat.unread_count > 0 && (
                          <div className={`min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full text-xs font-bold text-white bg-gray-500`}>
                            {chat.unread_count > 99 ? '99+' : chat.unread_count}
                          </div>
                       )}
                    </div>
                  </div>
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
