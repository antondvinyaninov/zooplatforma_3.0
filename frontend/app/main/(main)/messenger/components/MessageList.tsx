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
      className="flex-1 overflow-y-auto p-4 bg-[#F8F9FA] relative z-0"
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
                  className={`${isMyMessage ? 'bg-gradient-to-br from-[#1B76FF] to-[#0A58CA] text-white rounded-[24px] rounded-br-[6px] shadow-[0_4px_16px_rgba(27,118,255,0.25)]' : 'bg-white text-gray-900 rounded-[24px] rounded-bl-[6px] hover:bg-gray-50 border border-gray-50 shadow-[0_4px_16px_rgba(0,0,0,0.04)]'} p-1.5 pr-4 max-w-[85%] transition-all text-left block transform hover:-translate-y-0.5 hover:shadow-lg`}
                >
                  <div className="flex items-center gap-4">
                    {/* Фото животного */}
                    <div className="w-20 h-20 rounded-[20px] bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white font-semibold overflow-hidden flex-shrink-0 shadow-sm border border-white/10">
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
                        <span className="text-3xl">🐾</span>
                      )}
                    </div>

                    {/* Информация о животном */}
                    <div className="flex-1 py-1">
                      <div
                        className={`font-bold text-[16px] tracking-tight ${isMyMessage ? 'text-white' : 'text-gray-900'}`}
                      >
                        {petData.name}
                      </div>
                      <div className={`text-[13px] font-medium mt-0.5 ${isMyMessage ? 'text-white/80' : 'text-gray-500'}`}>
                        {petData.species}
                      </div>
                      {messageTime && (
                        <div
                          className={`text-[11px] font-semibold uppercase tracking-wider mt-1.5 ${isMyMessage ? 'text-white/60' : 'text-gray-400'}`}
                        >
                          {messageTime}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ) : (() => {
                const isMediaOnly = (!message.content || message.content.trim() === '') && message.attachments && message.attachments.length > 0 && message.attachments.every(a => a.type === 'photo' || a.type === 'video');

                return (
                <div
                  className={`${
                    isMediaOnly
                      ? 'bg-transparent shadow-none border-transparent p-0'
                      : isMyMessage
                      ? 'bg-gradient-to-br from-[#1B76FF] to-[#0A58CA] text-white shadow-[0_4px_16px_rgba(27,118,255,0.25)] border border-[#0A58CA]/20'
                      : 'bg-white text-gray-900 border border-gray-50 shadow-[0_4px_16px_rgba(0,0,0,0.04)]'
                  } ${isMyMessage ? 'rounded-[24px] rounded-br-[6px]' : 'rounded-[24px] rounded-bl-[6px]'} max-w-[75%] overflow-hidden transition-all leading-relaxed relative flex flex-col group`}
                >
                  {/* Вложения */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="flex flex-col flex-wrap">
                      {message.attachments.map((attachment, idx) => {
                        const isLastAttachment = idx === message.attachments!.length - 1;
                        return (
                        <div key={idx} className={`relative ${(attachment.type === 'photo' || attachment.type === 'video') && idx > 0 ? 'mt-0.5' : ''}`}>
                          {attachment.type === 'photo' && (
                            <img
                              src={attachment.url}
                              alt="Изображение"
                              className={`w-full h-auto cursor-pointer hover:opacity-95 transition-opacity ${!isMediaOnly && isLastAttachment ? 'mb-1' : ''}`}
                              onClick={() => window.open(attachment.url, '_blank')}
                              style={{ display: 'block', objectFit: 'cover' }}
                            />
                          )}
                          {attachment.type === 'video' && (
                            <video
                              src={attachment.url}
                              controls
                              className={`w-full h-auto ${!isMediaOnly && isLastAttachment ? 'mb-1' : ''}`}
                              style={{ display: 'block', objectFit: 'cover' }}
                            />
                          )}
                          {attachment.type !== 'photo' && attachment.type !== 'video' && (
                            <div className="pt-3 px-3 pb-1">
                              <FileAttachment attachment={attachment} isMyMessage={isMyMessage} />
                            </div>
                          )}
                        </div>
                      )})}
                    </div>
                  )}

                  {/* Текст сообщения */}
                  {message.content && !message.content.startsWith('📎') && (
                    <p className="px-4 pt-3 pb-1.5 text-[15.5px] leading-relaxed tracking-[0.01em] break-words">{message.content}</p>
                  )}

                  {messageTime && (
                    <div
                      className={`flex items-center justify-end gap-1.5 ${isMediaOnly ? 'absolute bottom-2 right-2 bg-black/40 backdrop-blur-md rounded-full px-2 py-0.5 shadow-sm' : 'px-4 pb-2.5 -mt-1'} z-10 transition-all duration-200`}
                    >
                      <span
                        className={`text-[11px] leading-none font-semibold uppercase tracking-wider ${isMediaOnly ? 'text-white' : isMyMessage ? 'text-white/70' : 'text-gray-400'}`}
                        style={isMediaOnly ? { marginTop: '1px' } : {}}
                      >
                        {messageTime}
                      </span>
                      {isMyMessage && (
                        <div className="flex items-center -ml-0.5">
                          <svg className={`w-[16px] h-[16px] shrink-0 ${isMediaOnly ? 'text-white' : 'text-white/60'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6L9 17l-5-5"></path>
                          </svg>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
              })()}
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
      className={`flex items-center gap-3.5 flex-1 hover:opacity-80 transition-opacity`}
    >
      <div
        className={`w-12 h-12 rounded-[14px] shadow-sm ${isMyMessage ? 'bg-white/20 text-white' : `${bgColor} border border-gray-100/50`} flex items-center justify-center flex-shrink-0`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0 pr-1">
        <p
          className={`text-[15px] font-bold tracking-tight truncate ${isMyMessage ? 'text-white' : 'text-gray-900'}`}
        >
          {fileName}
        </p>
        <div className="flex items-center mt-0.5">
          <span className={`text-[12px] font-semibold tracking-wider uppercase ${isMyMessage ? 'text-white/75' : iconColor}`}>
            {label}
          </span>
        </div>
      </div>
      <svg
        className={`w-5 h-5 ${isMyMessage ? 'text-white/80' : 'text-gray-400'} flex-shrink-0 ml-1`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
    </a>
  );
}
