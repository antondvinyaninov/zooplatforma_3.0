'use client';

import { useState, useRef } from 'react';

interface MessageInputProps {
  messageText: string;
  sending: boolean;
  onMessageChange: (text: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function MessageInput({
  messageText,
  sending,
  onMessageChange,
  onSendMessage,
  onFileSelect,
}: MessageInputProps) {
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage(e as any);
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 p-3 md:p-4 relative pb-[max(env(safe-area-inset-bottom,12px),12px)]">
      {/* Скрытый input для выбора файлов */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,application/*"
        onChange={onFileSelect}
        className="hidden"
      />

      {/* Меню вложений */}
      {showAttachMenu && (
        <div className="absolute bottom-16 left-4 bg-white rounded-xl shadow-lg p-1 w-48 border border-gray-200">
          <button
            onClick={() => {
              setShowAttachMenu(false);
              if (fileInputRef.current) {
                fileInputRef.current.accept = 'image/*';
                fileInputRef.current.click();
              }
            }}
            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg
                className="w-4 h-4 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <span className="text-gray-900 text-sm">Фото</span>
          </button>

          <button
            onClick={() => {
              setShowAttachMenu(false);
              if (fileInputRef.current) {
                fileInputRef.current.accept = 'video/*';
                fileInputRef.current.click();
              }
            }}
            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg
                className="w-4 h-4 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <span className="text-gray-900 text-sm">Видео</span>
          </button>

          <button
            onClick={() => {
              setShowAttachMenu(false);
              if (fileInputRef.current) {
                fileInputRef.current.accept = '*/*';
                fileInputRef.current.click();
              }
            }}
            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg
                className="w-4 h-4 text-gray-600"
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
            </div>
            <span className="text-gray-900 text-sm">Файл</span>
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowAttachMenu(!showAttachMenu)}
          className="w-[36px] h-[36px] hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center flex-shrink-0"
        >
          <svg className="w-[30px] h-[30px] text-[#818c99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 5v14m-7-7h14" />
          </svg>
        </button>

        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Сообщение"
            value={messageText}
            onChange={(e) => onMessageChange(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={sending}
            className="w-full px-4 py-[9px] bg-[#f0f2f5] border-0 rounded-3xl focus:outline-none focus:ring-1 focus:ring-[#2688eb] focus:bg-white text-[15px] pr-10 disabled:opacity-50"
          />
          <button className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors">
            <svg className="w-5 h-5 text-[#818c99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>

        <button
          onClick={onSendMessage}
          disabled={!messageText.trim() || sending}
          className="w-[36px] h-[36px] hover:bg-gray-100 rounded-full transition-all flex items-center justify-center flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed text-[#2688eb]"
        >
          {sending ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent"></div>
          ) : (
            <svg className="w-7 h-7 translate-y-[-1px] translate-x-[1px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
