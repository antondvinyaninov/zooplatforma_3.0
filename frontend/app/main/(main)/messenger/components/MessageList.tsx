'use client';

import { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Message } from '../types';
import { getMediaFileUrl } from '@/lib/urls';
import { useVirtualizer } from '@tanstack/react-virtual';

interface MessageListProps {
  messages: Message[];
  currentUserId?: number;
  isLoading?: boolean;
}

export default function MessageList({ messages, currentUserId, isLoading }: MessageListProps) {
  const router = useRouter();
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Виртуализация списка сообщений
  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => messagesContainerRef.current,
    estimateSize: () => 80, // примерная высота одного сообщения
    overscan: 5, // сколько сообщений рендерить за пределами экрана для плавности
  });

  // Автоскролл к последнему сообщению при добавлении новых
  useEffect(() => {
    if (messages.length > 0) {
      // Даем React время на рендер новых элементов, затем скроллим к концу виртуального списка
      const timer = setTimeout(() => {
        rowVirtualizer.scrollToIndex(messages.length - 1, { align: 'end' });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [messages.length, rowVirtualizer]);

  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto p-4"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e3f2fd' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        backgroundColor: '#e3f2fd',
      }}
    >
      {isLoading ? (
        <div className="flex flex-col gap-4 animate-pulse pt-4">
          <div className="h-12 w-[60%] bg-gray-200/50 rounded-2xl rounded-bl-md self-start" />
          <div className="h-16 w-[70%] bg-blue-300/50 rounded-2xl rounded-br-md self-end" />
          <div className="h-10 w-[40%] bg-gray-200/50 rounded-2xl rounded-bl-md self-start" />
        </div>
      ) : (
        <div 
          className="max-w-4xl mx-auto relative w-full"
          style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const message = messages[virtualRow.index];
            const isMyMessage = message.sender_id === currentUserId;

          let messageTime = '';
          try {
            if (message.created_at) {
              const date = new Date(message.created_at);
              if (!isNaN(date.getTime())) {
                messageTime = date.toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
              }
            }
          } catch (e) {
            // Ошибка парсинга даты
          }

          // Проверяем, является ли это сообщением с животным
          let petData = null;
          try {
            if (message.content && message.content.startsWith('{')) {
              const parsed = JSON.parse(message.content);
              if (parsed.type === 'pet') {
                petData = parsed;
              }
            }
          } catch (e) {
            // Не JSON, обычное сообщение
          }

          // Пропускаем сообщения без контента и без вложений
          if (!message.content && (!message.attachments || message.attachments.length === 0)) {
            return null;
          }

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              className={`absolute top-0 left-0 w-full flex items-end gap-2 py-1.5 ${isMyMessage ? 'justify-end' : ''}`}
              style={{
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {/* Сообщение с животным */}
              {petData ? (
                <button
                  onClick={() => router.push(`/pets/${petData.id}`)}
                  className={`${isMyMessage ? 'bg-blue-500 text-white rounded-2xl rounded-br-md hover:bg-blue-600' : 'bg-white text-gray-900 rounded-2xl rounded-bl-md hover:bg-gray-50'} p-3 shadow-sm max-w-[70%] transition-colors text-left`}
                >
                  <div className="flex items-center gap-3">
                    {/* Фото животного */}
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white font-semibold overflow-hidden flex-shrink-0">
                      {petData.photo ? (
                        <img
                          src={getMediaFileUrl(petData.photo)}
                          alt={petData.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-2xl">🐾</span>
                      )}
                    </div>

                    {/* Информация о животном */}
                    <div className="flex-1">
                      <div
                        className={`font-semibold text-sm ${isMyMessage ? 'text-white' : 'text-gray-900'}`}
                      >
                        {petData.name}
                      </div>
                      <div className={`text-xs ${isMyMessage ? 'text-blue-100' : 'text-gray-600'}`}>
                        {petData.species}
                      </div>
                      {messageTime && (
                        <div
                          className={`text-xs mt-1 ${isMyMessage ? 'text-blue-100' : 'text-gray-500'}`}
                        >
                          {messageTime}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ) : (
                <div
                  className={`${isMyMessage ? 'bg-blue-500 text-white rounded-2xl rounded-br-md' : 'bg-white text-gray-900 rounded-2xl rounded-bl-md'} shadow-sm max-w-[70%] overflow-hidden`}
                >
                  {/* Вложения */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className={`${message.content ? 'mb-2' : ''} space-y-2`}>
                      {message.attachments.map((attachment, idx) => (
                        <div key={idx}>
                          {attachment.type === 'photo' && (
                            <img
                              src={attachment.url}
                              alt="Изображение"
                              className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(attachment.url, '_blank')}
                            />
                          )}
                          {attachment.type === 'video' && (
                            <video
                              src={attachment.url}
                              controls
                              className="w-full h-auto"
                            />
                          )}
                          {attachment.type !== 'photo' && attachment.type !== 'video' && (
                            <div className="p-2">
                              <FileAttachment attachment={attachment} isMyMessage={isMyMessage} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Текст сообщения */}
                  {message.content && !message.content.startsWith('📎') && (
                    <p className="px-4 py-2">{message.content}</p>
                  )}

                  {messageTime && (
                    <div
                      className={`flex items-center ${isMyMessage ? 'justify-end' : ''} gap-1 mt-1 px-4 pb-2`}
                    >
                      <span
                        className={`text-xs ${isMyMessage ? 'text-blue-100' : 'text-gray-500'}`}
                      >
                        {messageTime}
                      </span>
                      {isMyMessage && (
                        <>
                          {message.is_read ? (
                            // Две галочки - прочитано
                            <>
                              <svg
                                className="w-4 h-4 text-blue-200"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              <svg
                                className="w-4 h-4 text-blue-200 -ml-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </>
                          ) : (
                            // Одна галочка - отправлено, но не прочитано
                            <svg
                              className="w-4 h-4 text-blue-200"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
          })}
        </div>
      )}
    </div>
  );
}

// Компонент для отображения файловых вложений
function FileAttachment({ attachment, isMyMessage }: { attachment: any; isMyMessage: boolean }) {
  const fileName = attachment.file_name || attachment.url.split('/').pop() || 'Файл';
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  // Определяем иконку и цвет по расширению
  let iconColor = 'text-gray-600';
  let bgColor = 'bg-gray-100';
  let label = ext.toUpperCase() || 'FILE';
  let icon = null;

  if (['pdf'].includes(ext)) {
    iconColor = 'text-red-600';
    bgColor = 'bg-red-100';
    label = 'PDF';
    icon = (
      <svg
        className={`w-6 h-6 ${isMyMessage ? 'text-white' : iconColor}`}
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
        <path d="M14 2v6h6M9 13h6M9 17h6M9 9h1" />
      </svg>
    );
  } else if (['doc', 'docx'].includes(ext)) {
    iconColor = 'text-blue-600';
    bgColor = 'bg-blue-100';
    label = 'DOC';
    icon = (
      <svg
        className={`w-6 h-6 ${isMyMessage ? 'text-white' : iconColor}`}
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
        <path d="M14 2v6h6M9 13h6M9 17h6M9 9h1" />
      </svg>
    );
  } else {
    // По умолчанию
    icon = (
      <svg
        className={`w-6 h-6 ${isMyMessage ? 'text-white' : iconColor}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    );
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-3 p-3 rounded-lg ${isMyMessage ? '' : 'bg-gray-100'} hover:opacity-80 transition-opacity`}
    >
      <div
        className={`w-10 h-10 rounded-lg ${isMyMessage ? 'bg-blue-600' : bgColor} flex items-center justify-center flex-shrink-0`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate ${isMyMessage ? 'text-white' : 'text-gray-900'}`}
        >
          {fileName}
        </p>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${isMyMessage ? 'text-blue-100' : iconColor}`}>
            {label}
          </span>
        </div>
      </div>
      <svg
        className={`w-5 h-5 ${isMyMessage ? 'text-white' : 'text-gray-400'} flex-shrink-0`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
    </a>
  );
}
