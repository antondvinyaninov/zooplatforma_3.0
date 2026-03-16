'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { UserIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { postsApi } from '@/lib/api';
import { getMediaUrl, getFullName } from '@/lib/utils';

interface Liker {
  id: number;
  name?: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  avatar_url?: string;
  reaction_type?: string;
}

interface LikersModalProps {
  postId: number;
  isOpen: boolean;
  onClose: () => void;
}

const reactionEmojis: Record<string, string> = {
  like: '❤️',
  haha: '😂',
  wow: '😲',
  love: '🥰',
  sad: '😢',
  angry: '😡'
};

export default function LikersModal({ postId, isOpen, onClose }: LikersModalProps) {
  const [likers, setLikers] = useState<Liker[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      loadLikers();
    } else {
      setLikers([]); // clear when closed
      setActiveTab('all');
    }
  }, [isOpen, postId]);

  const loadLikers = async () => {
    setLoading(true);
    try {
      const response = await postsApi.getLikers(postId);
      if (response.success && response.data) {
        setLikers(response.data);
        // ✅ Закрываем модалку если лайков нет
        if (response.data.length === 0) {
          onClose();
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки списка лайков:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !mounted) return null;

  // Группировка реакций
  const reactionCounts = likers.reduce((acc, liker) => {
    const type = liker.reaction_type || 'like';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const displayedLikers = activeTab === 'all' 
    ? likers 
    : likers.filter(l => (l.reaction_type || 'like') === activeTab);

  const modalContent = (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 overflow-hidden" onClick={onClose}>
      <div 
        className="bg-[#222222] w-full max-w-sm rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Tabs) */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-4">
            {/* Active Tab: All */}
            <button 
              onClick={() => setActiveTab('all')}
              className={`${activeTab === 'all' ? 'bg-white/10 hover:bg-white/20 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'} transition-colors px-4 py-1.5 rounded-2xl font-medium text-[15px] flex items-center gap-2`}
            >
              <span>Все {likers.length}</span>
            </button>
            
            {/* Reaction Tabs */}
            {Object.entries(reactionCounts).map(([type, count]) => (
              <button 
                key={type}
                onClick={() => setActiveTab(type)}
                className={`${activeTab === type ? 'bg-white/10 hover:bg-white/20 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'} transition-colors px-3 py-1.5 rounded-2xl font-medium text-[15px] flex items-center gap-1.5 whitespace-nowrap`}
              >
                <span className="text-[18px]">{reactionEmojis[type] || '❤️'}</span>
                <span>{count}</span>
              </button>
            ))}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-gray-400 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-600">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
            </div>
          ) : displayedLikers.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400">Нет оценок</div>
          ) : (
            <div className="space-y-1">
              {displayedLikers.map((liker) => (
                <Link
                  key={liker.id}
                  href={`/id${liker.id}`}
                  className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition-colors"
                  onClick={onClose}
                >
                  {/* Avatar with Heart Badge */}
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium overflow-hidden">
                      {liker.avatar || liker.avatar_url ? (
                        <img
                          src={getMediaUrl(liker.avatar || liker.avatar_url || '') || ''}
                          alt={liker.first_name || liker.name || ''}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <UserIcon className="w-6 h-6" />
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#222222] rounded-full flex items-center justify-center">
                      <span className="text-[12px] leading-none">{reactionEmojis[liker.reaction_type || 'like'] || '❤️'}</span>
                    </div>
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-medium text-white truncate">
                      {getFullName(liker.first_name || liker.name || '', liker.last_name)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
