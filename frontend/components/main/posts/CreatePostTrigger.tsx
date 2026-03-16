'use client';

import { UserIcon } from '@heroicons/react/24/outline';
import { getMediaUrl } from '@/lib/utils';

interface CreatePostTriggerProps {
  userAvatar?: string;
  userName: string;
  onOpenModal: () => void;
}

export default function CreatePostTrigger({
  userAvatar,
  userName,
  onOpenModal,
}: CreatePostTriggerProps) {
  return (
    <div className="flex items-start gap-3 p-4">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-semibold flex-shrink-0 overflow-hidden">
        {userAvatar ? (
          <img
            src={getMediaUrl(userAvatar) || ''}
            alt={userName}
            className="w-full h-full object-cover"
          />
        ) : (
          <UserIcon className="w-6 h-6 text-gray-500" />
        )}
      </div>

      {/* Input Trigger */}
      <button
        onClick={onOpenModal}
        className="flex-1 text-left text-gray-500 text-[15px] py-2 hover:text-gray-700 transition-colors"
      >
        Что нового?
      </button>
    </div>
  );
}
