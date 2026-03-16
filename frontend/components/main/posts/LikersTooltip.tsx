'use client';

import { useEffect, useState } from 'react';
import { UserIcon } from '@heroicons/react/24/outline';
import { postsApi } from '@/lib/api';
import { getMediaUrl } from '@/lib/utils';

interface LikersTooltipProps {
  postId: number;
  isVisible: boolean;
  totalLikes: number;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onReaction?: (reactionType: string) => void;
  onLikersClick?: () => void;
}

export default function LikersTooltip({ postId, isVisible, totalLikes, onMouseEnter, onMouseLeave, onReaction, onLikersClick }: LikersTooltipProps) {
  const [likers, setLikers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (isVisible && !hasLoaded) {
      loadLikers();
    }
  }, [isVisible, postId, hasLoaded]);

  const loadLikers = async () => {
    setLoading(true);
    try {
      const response = await postsApi.getLikers(postId);
      if (response.success && response.data) {
        setLikers(response.data.slice(0, 6)); // Берем только первые 6 для тултипа
        setHasLoaded(true);
      }
    } catch (error) {
      console.error('Ошибка загрузки списка лайков:', error);
    } finally {
      setLoading(false);
    }
  };

  // Не показываем тултип, если нет лайков или он скрыт
  if (!isVisible || totalLikes === 0) return null;

  return (
    <div 
      className="absolute bottom-[calc(100%+8px)] left-0 z-[110] flex flex-col bg-[#2e2e2e] text-white p-3 rounded-[16px] shadow-2xl transition-opacity duration-200 min-w-[240px]"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      
      {/* Верхний ряд: Иконки реакций (Визуальная имитация ВК) */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 px-1 gap-2">
        <button 
          onClick={(e) => { e.stopPropagation(); onReaction?.('like'); }}
          className="text-2xl drop-shadow-sm hover:scale-125 hover:-translate-y-1 transition-all cursor-pointer"
        >❤️</button>
        <button 
          onClick={(e) => { e.stopPropagation(); onReaction?.('haha'); }}
          className="text-2xl drop-shadow-sm opacity-90 hover:opacity-100 hover:scale-125 hover:-translate-y-1 transition-all cursor-pointer"
        >😂</button>
        <button 
          onClick={(e) => { e.stopPropagation(); onReaction?.('wow'); }}
          className="text-2xl drop-shadow-sm opacity-90 hover:opacity-100 hover:scale-125 hover:-translate-y-1 transition-all cursor-pointer"
        >😲</button>
        <button 
          onClick={(e) => { e.stopPropagation(); onReaction?.('love'); }}
          className="text-2xl drop-shadow-sm opacity-90 hover:opacity-100 hover:scale-125 hover:-translate-y-1 transition-all cursor-pointer"
        >🥰</button>
        <button 
          onClick={(e) => { e.stopPropagation(); onReaction?.('sad'); }}
          className="text-2xl drop-shadow-sm opacity-90 hover:opacity-100 hover:scale-125 hover:-translate-y-1 transition-all cursor-pointer"
        >😢</button>
        <button 
          onClick={(e) => { e.stopPropagation(); onReaction?.('angry'); }}
          className="text-2xl drop-shadow-sm opacity-90 hover:opacity-100 hover:scale-125 hover:-translate-y-1 transition-all cursor-pointer"
        >😡</button>
      </div>

      {/* Нижний ряд: Аватарки и счетчик */}
      <div 
        className="flex items-center gap-3 pt-3 px-1 mt-1 cursor-pointer hover:bg-white/5 rounded-lg transition-colors p-1 -mx-1"
        onClick={(e) => { e.stopPropagation(); onLikersClick?.(); }}
      >
        <div className="flex -space-x-2">
          {likers.slice(0, 3).map((liker, i) => (
            <div
              key={liker.id}
              className="w-7 h-7 rounded-full border-2 border-[#2e2e2e] bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white overflow-hidden flex-shrink-0 relative"
              style={{ zIndex: 10 - i }}
            >
              {liker.avatar || liker.avatar_url ? (
                <img
                  src={getMediaUrl(liker.avatar || liker.avatar_url || '') || ''}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon className="w-4 h-4" />
              )}
            </div>
          ))}
          {loading && !hasLoaded && (
            <div className="w-7 h-7 rounded-full bg-gray-600 animate-pulse border-2 border-[#2e2e2e]"></div>
          )}
        </div>
        <span className="text-[14px] font-medium text-[#999999]">
          {totalLikes} {getReactionWord(totalLikes)}
        </span>
      </div>
    </div>
  );
}

function getReactionWord(count: number) {
  const lastDigit = count % 10;
  const lastTwo = count % 100;
  if (lastTwo >= 11 && lastTwo <= 19) return 'реакций';
  if (lastDigit === 1) return 'реакция';
  if (lastDigit >= 2 && lastDigit <= 4) return 'реакции';
  return 'реакций';
}
