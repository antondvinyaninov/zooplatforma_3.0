'use client';

import { User } from '../types';
import { getMediaUrl } from '@/lib/utils';

interface ChatHeaderProps {
  user: User | null;
  onClose: () => void;
}

export default function ChatHeader({ user, onClose }: ChatHeaderProps) {
  if (!user) return null;

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
          {user.avatar ? (
            <img
              src={getMediaUrl(user.avatar)}
              alt={user.name}
              className="w-[38px] h-[38px] rounded-full object-cover"
            />
          ) : (
            <div className="w-[38px] h-[38px] rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
              {user.name?.[0]?.toUpperCase() || '?'}
            </div>
          )}

          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <h3 className="font-semibold text-[16px] text-[#2c2d2e] tracking-tight leading-tight">
                {user.name} {user.last_name}
              </h3>
              <svg className="w-[14px] h-[14px] text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              </svg>
            </div>
            <p className="text-[13px] text-[#818c99] font-normal leading-tight mt-[1px]">
              {user.is_online ? <span className="text-[#2688eb]">онлайн</span> : getLastSeenText(user.last_seen)}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
