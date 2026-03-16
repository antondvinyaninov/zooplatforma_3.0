'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  XMarkIcon,
  UserIcon,
  HeartIcon,
  PaperClipIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import PostComments from '../shared/PostComments';
import ConfirmModal from '../shared/ConfirmModal';
import PollDisplay from '../polls/PollDisplay';
import PhotoGrid from './PhotoGrid';
import LikersModal from './LikersModal';
import LikersTooltip from './LikersTooltip';
import { commentsApi, Comment, postsApi } from '../../../lib/api';
import { apiClient } from '../../../lib/api/client';
import { useAuth } from '../../../contexts/AuthContext';
import { useLongPress } from '../../../hooks/useLongPress';

import { getFullName, getMediaUrl } from '../../../lib/utils';

interface Attachment {
  url: string;
  type: string;
  file_name?: string;
  size?: number;
  media_type?: string;
  [key: string]: unknown;
}

interface User {
  id: number;
  first_name?: string;
  name?: string;
  last_name?: string;
  email?: string;
  avatar_url?: string;
  avatar?: string;
}

interface Organization {
  id: number;
  name: string;
  short_name?: string;
  logo?: string;
  type?: string;
}

interface Pet {
  id: number;
  name: string;
  species: string;
  photo?: string;
}

interface PollOption {
  id: number;
  option_text: string;
  votes_count: number;
  percentage?: number;
  voters?: PollVoter[];
}

interface PollVoter {
  user_id: number;
  user_name: string;
  avatar?: string;
}

interface Poll {
  id: number;
  question: string;
  multiple_choice: boolean;
  allow_vote_changes: boolean;
  anonymous_voting: boolean;
  expires_at?: string;
  options: PollOption[];
  total_voters: number;
  user_voted: boolean;
  user_votes?: number[];
  is_expired: boolean;
  voters?: PollVoter[];
}

interface Post {
  id: number;
  author_id: number;
  author_type: string;
  content: string;
  attached_pets: number[];
  attachments: Attachment[];
  tags: string[];
  created_at: string;
  updated_at: string;
  user?: User;
  organization?: Organization;
  pets?: Pet[];
  poll?: Poll;
  comments_count: number;
  likes_count?: number;
  has_poll?: boolean;
  user_reaction?: string;
  reply_setting?: string;
}

interface PostModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
  onCountChange?: (count: number) => void;
  initialIsLiked?: boolean;
  initialLikesCount?: number;
  onLikeChange?: (liked: boolean, count: number) => void;
}

export default function PostModal({
  post,
  isOpen,
  onClose,
  onCountChange,
  initialIsLiked = false,
  initialLikesCount,
  onLikeChange,
}: PostModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [replyTo, setReplyTo] = useState<{
    commentId: number;
    userName: string;
    userId: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount ?? post.likes_count ?? 0);
  const [selectedReaction, setSelectedReaction] = useState<string | null>(post.user_reaction || null);
  const [isLiking, setIsLiking] = useState(false);
  const [showLikersModal, setShowLikersModal] = useState(false);
  const [showLikersTooltip, setShowLikersTooltip] = useState(false);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [poll, setPoll] = useState<Poll | null>(post.poll || null);
  const [isPollLoading, setIsPollLoading] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<{ id: number; parentId?: number } | null>(null);
  const [isDeletingComment, setIsDeletingComment] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Сохраняем текущую позицию скролла
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      // Загружаем комментарии только один раз при открытии
      if (!commentsLoaded) {
        loadComments();
      }
      
      // Загружаем опрос
      if (post.has_poll && !poll && !isPollLoading) {
        loadPoll();
      }
    } else {
      // При закрытии сбрасываем состояние
      setComments([]);
      setReplyTo(null);
      setNewComment('');
      setCommentsLoaded(false);
      // Сбрасываем состояние лайков к начальным значениям
      setIsLiked(initialIsLiked);
      setLikesCount(initialLikesCount ?? post.likes_count ?? 0);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      if (!isOpen) {
        // Восстанавливаем позицию скролла
        const scrollY = document.body.style.top;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        const scrollPosition = parseInt(scrollY || '0') * -1;
        // Не прокручиваем если позиция 0 или отрицательная
        if (scrollPosition > 0) {
          window.scrollTo(0, scrollPosition);
        }
      }
    };
  }, [isOpen, onClose, commentsLoaded, initialIsLiked, initialLikesCount, post.likes_count]);

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const response = await commentsApi.getPostComments(post.id);
      if (response.success && response.data) {
        setComments(response.data);
        setCommentsLoaded(true);
        const count = response.data.reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0);
        onCountChange?.(count);
      }
    } catch (error) {
      console.error('Ошибка загрузки комментариев:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMouseEnterTooltip = () => {
    if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    setShowLikersTooltip(true);
  };

  const handleMouseLeaveTooltip = () => {
    tooltipTimeoutRef.current = setTimeout(() => {
      setShowLikersTooltip(false);
    }, 300);
  };

  const loadPoll = async () => {
    try {
      setIsPollLoading(true);
      const response = await apiClient.get<Poll>(`/api/polls/post/${post.id}`);
      if (response.success && response.data) {
        setPoll(response.data);
      }
    } catch (error) {
      console.error(`Error loading poll for post ${post.id}:`, error);
    } finally {
      setIsPollLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newComment.trim() && attachments.length === 0) || !isAuthenticated || isSubmitting) return;

    // Сохраняем текущую позицию скролла
    const scrollTop = scrollContainerRef.current?.scrollTop || 0;

    setIsSubmitting(true);
    try {
      const response = await commentsApi.create(post.id, {
        content: newComment.trim(),
        parent_id: replyTo?.commentId,
        reply_to_user_id: replyTo?.userId,
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      if (response.success && response.data) {
        let newComments;
        if (replyTo) {
          newComments = comments.map((c) => {
            if (c.id === replyTo.commentId) {
              return {
                ...c,
                replies: [...(c.replies || []), response.data!],
              };
            }
            return c;
          });
        } else {
          newComments = [...comments, response.data];
        }
        setComments(newComments);

        const count = newComments.reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0);
        onCountChange?.(count);

        setNewComment('');
        setReplyTo(null);
        setAttachments([]);
        if (fileInputRef.current) fileInputRef.current.value = '';

        // Убираем фокус с input
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }

        // Восстанавливаем позицию скролла через двойной RAF
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (scrollContainerRef.current) {
              // Если это новый корневой комментарий, добавляем небольшой отступ вниз
              if (!replyTo) {
                scrollContainerRef.current.scrollTop = scrollTop + 100;
              } else {
                scrollContainerRef.current.scrollTop = scrollTop;
              }
            }
          });
        });
      } else {
        alert(response.error || 'Ошибка создания комментария');
      }
    } catch (error) {
      console.error('Ошибка создания комментария:', error);
      alert('Ошибка создания комментария');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLike = async (reactionType: string = 'like') => {
    if (!isAuthenticated) return;
    if (isLiking) return;

    const wasLiked = isLiked;
    const oldCount = likesCount;
    const oldReaction = selectedReaction;
    const isUnliking = wasLiked && oldReaction === reactionType;

    // Обновляем UI мгновенно
    setIsLiked(!isUnliking);
    setSelectedReaction(isUnliking ? null : reactionType);
    setLikesCount(isUnliking ? Math.max(0, oldCount - 1) : (!wasLiked ? oldCount + 1 : oldCount));
    setIsLiking(true);

    try {
      const response = await postsApi.toggleLike(post.id, reactionType);

      if (response.success && response.data) {
        const newLiked = response.data.liked;
        const newCount = response.data.likes_count;

        setIsLiked(newLiked);
        setSelectedReaction(response.data.reaction_type || (newLiked ? 'like' : null));
        setLikesCount(newCount);

        // Уведомляем родительский компонент БЕЗ триггера ре-рендера
        setTimeout(() => {
          onLikeChange?.(newLiked, newCount);
        }, 0);
      } else {
        // Откатываем при ошибке
        setIsLiked(wasLiked);
        setSelectedReaction(oldReaction);
        setLikesCount(oldCount);
      }
    } catch (error) {
      console.error('Ошибка лайка:', error);
      setIsLiked(wasLiked);
      setSelectedReaction(oldReaction);
      setLikesCount(oldCount);
    } finally {
      setIsLiking(false);
    }
  };

  const deleteComment = async (commentId: number, parentId?: number) => {
    setIsDeletingComment(true);
    try {
      const response = await commentsApi.delete(commentId);
      if (response.success) {
        let newComments;
        if (parentId) {
          newComments = comments.map((c) => {
            if (c.id === parentId) {
              return {
                ...c,
                replies: c.replies?.filter((r) => r.id !== commentId),
              };
            }
            return c;
          });
        } else {
          newComments = comments.filter((c) => c.id !== commentId);
        }
        setComments(newComments);

        const count = newComments.reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0);
        onCountChange?.(count);
      } else {
        alert(response.error || 'Ошибка удаления комментария');
      }
    } catch (error) {
      console.error('Ошибка удаления комментария:', error);
      alert('Ошибка удаления комментария');
    } finally {
      setIsDeletingComment(false);
      setCommentToDelete(null);
    }
  };

  const handleDelete = (commentId: number, parentId?: number) => {
    setCommentToDelete({ id: commentId, parentId });
  };

  const longPressEvent = useLongPress(
    (e: React.TouchEvent | React.MouseEvent) => {
      // При долгом нажатии показываем тултип с реакциями
      if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
      setShowLikersTooltip(true);
      // Предотвращаем скролл/контекстное меню
      if (e && 'touches' in e && e.preventDefault) {
        e.preventDefault();
      }
    },
    () => {
      // При коротком нажатии ставим обычный лайк (или убираем)
      handleLike(selectedReaction || 'like');
    },
    { delay: 400 } // 400ms для лонг-пресса
  );

  if (!isOpen || !mounted) return null;

  const getTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ru });
    } catch {
      return 'недавно';
    }
  };

  const getTagTextColor = (tag: string) => {
    switch (tag) {
      case 'потерян':
        return 'text-red-700';
      case 'найден':
        return 'text-green-700';
      case 'ищет дом':
        return 'text-orange-700';
      default:
        return 'text-gray-700';
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-white/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-semibold text-gray-900">Метка</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto"
          style={{ overflowAnchor: 'none' }}
        >
          {/* Post Content */}
          <div className="px-6 py-4">
            {/* Author */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-semibold overflow-hidden">
                {(post.user?.avatar_url || post.user?.avatar) ? (
                  <img
                    src={getMediaUrl(post.user?.avatar_url || post.user?.avatar) || ''}
                    alt={post.user?.first_name || post.user?.name || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-6 h-6 text-gray-500" />
                )}
              </div>
              <div>
                <div className="font-semibold text-gray-900">
                  {getFullName(post.user?.first_name || post.user?.name || 'Пользователь', post.user?.last_name)}
                </div>
                <div className="text-sm text-gray-500">{getTimeAgo(post.created_at)}</div>
              </div>
            </div>

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="flex gap-2 mb-3">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getTagTextColor(tag)}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Content */}
            <div className="text-gray-900 mb-4 whitespace-pre-wrap text-base">{post.content}</div>

            {/* Photos/Videos */}
            {post.attachments && post.attachments.length > 0 && (
              <div className="mb-4">
                <PhotoGrid
                  photos={post.attachments.filter(
                    (a) =>
                      a.type === 'image' ||
                      a.type === 'video' ||
                      a.media_type === 'image' ||
                      a.media_type === 'video',
                  )}
                />
              </div>
            )}

            {/* Poll */}
            {poll && (
              <div className="mb-4">
                <PollDisplay poll={poll} />
              </div>
            )}
            {post.has_poll && !poll && isPollLoading && (
              <div className="mb-4 text-gray-500">
                Загрузка опроса...
              </div>
            )}

            {/* Attached Pets */}
            {post.pets && post.pets.length > 0 && (
              <div className="space-y-2 mb-4">
                {post.pets.map((pet) => (
                  <div
                    key={pet.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white font-semibold overflow-hidden">
                      {pet.photo ? (
                        <img
                          src={pet.photo}
                          alt={pet.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        pet.name[0]?.toUpperCase()
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{pet.name}</div>
                      <div className="text-sm text-gray-600">{pet.species}</div>
                    </div>
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-6 text-gray-600 py-3 border-t border-gray-100">
              <div 
                className="relative flex items-center gap-0.5"
                onMouseEnter={handleMouseEnterTooltip}
                onMouseLeave={handleMouseLeaveTooltip}
              >
                {/* Кнопка Лайка (иконка) - с поддержкой долгого нажатия */}
                <button
                  {...longPressEvent}
                  className={`flex items-center justify-center p-1.5 -ml-1.5 rounded-full outline-none select-none transition-colors ${
                    isLiked && (!selectedReaction || selectedReaction === 'like') 
                      ? 'text-red-500 hover:bg-red-50' 
                      : isLiked 
                        ? 'text-gray-900 hover:bg-gray-100' 
                        : 'hover:bg-gray-100 hover:text-red-500'
                  }`}
                  style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                >
                  {isLiked && selectedReaction && selectedReaction !== 'like' ? (
                    <span className="text-xl leading-none flex items-center justify-center pointer-events-none block">
                      {
                        {
                          haha: '😂',
                          wow: '😲',
                          love: '🥰',
                          sad: '😢',
                          angry: '😡'
                        }[selectedReaction] || '❤️'
                      }
                    </span>
                  ) : (
                    isLiked ? (
                      <HeartIconSolid className="w-6 h-6 text-red-500 pointer-events-none block" />
                    ) : (
                      <HeartIcon className="w-6 h-6 pointer-events-none block" />
                    )
                  )}
                </button>

                {/* Кнопка Цифры (количество лайков) - открывает модалку со списком */}
                {likesCount > 0 && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowLikersModal(true);
                      setShowLikersTooltip(false);
                    }}
                    className="text-sm font-medium hover:underline px-1 py-1 focus:outline-none"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    {likesCount}
                  </button>
                )}

                <LikersTooltip
                  postId={post.id}
                  isVisible={showLikersTooltip && !showLikersModal}
                  totalLikes={likesCount}
                  onMouseEnter={handleMouseEnterTooltip}
                  onMouseLeave={handleMouseLeaveTooltip}
                  onReaction={(type) => {
                    handleLike(type);
                    setShowLikersTooltip(false);
                  }}
                  onLikersClick={() => {
                    setShowLikersModal(true);
                    setShowLikersTooltip(false);
                  }}
                />

                <LikersModal
                  postId={post.id}
                  isOpen={showLikersModal}
                  onClose={() => setShowLikersModal(false)}
                />
              </div>

              <button className="flex items-center gap-2 hover:text-blue-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <span className="text-sm font-medium">
                  {comments.reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0)}
                </span>
              </button>

              <button className="flex items-center gap-2 hover:text-purple-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Comments */}
          <PostComments
            postId={post.id}
            comments={comments}
            isLoading={isLoading}
            onReplyClick={(commentId, userName, userId) =>
              setReplyTo({ commentId, userName, userId })
            }
            onDelete={handleDelete}
            displayOnly={true}
          />
        </div>

        {/* Sticky Footer with Input - вне scroll области */}
        {isAuthenticated && (
          <div className="border-t border-gray-200 bg-white px-6 py-4">
            {post.reply_setting && post.reply_setting !== 'everyone' && user?.id !== post.author_id && (
              <div className="mb-3 text-xs text-gray-500 bg-gray-50 p-2 rounded-md border border-gray-100 flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {post.reply_setting === 'followers' 
                  ? 'Автор ограничил возможность комментирования. Оставлять комментарии могут только его подписчики.'
                  : 'Автор ограничил возможность комментирования. Оставлять комментарии могут только те, на кого он подписан.'}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              {replyTo && (
                <div className="mb-2 text-sm text-gray-600 flex items-center gap-2">
                  <span>
                    Ответ для{' '}
                    <span className="font-semibold" style={{ color: '#1B76FF' }}>
                      {replyTo.userName}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setReplyTo(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0 overflow-hidden text-white text-sm font-semibold">
                  {(user?.avatar_url || user?.avatar) ? (
                    <img
                      src={getMediaUrl(user?.avatar_url || user?.avatar) || ''}
                      alt={user?.first_name || user?.name || 'User'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-4 h-4 text-gray-500" />
                  )}
                </div>
                <div className="flex-1 flex flex-col gap-2 min-w-0">
                  {attachments.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {attachments.map((file, index) => (
                        <div key={index} className="relative flex-shrink-0">
                          <div className="w-16 h-16 rounded-md overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
                            {file.type.startsWith('image/') ? (
                              <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs text-gray-500 uppercase">{file.name.split('.').pop()}</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-sm transition-colors"
                          >
                            <XMarkIcon className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 items-center">
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 -ml-2 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                    >
                      <PaperClipIcon className="w-6 h-6" />
                    </button>
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={
                        replyTo ? `Ответить ${replyTo.userName}...` : 'Написать комментарий...'
                      }
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent bg-white"
                      style={{ '--tw-ring-color': '#1B76FF' } as React.CSSProperties}
                    />
                    <button
                      type="submit"
                      disabled={(!newComment.trim() && attachments.length === 0) || isSubmitting}
                      className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: '#1B76FF' }}
                    >
                      {isSubmitting ? '...' : 'Отправить'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(
    <>
      {modalContent}
      <ConfirmModal
        isOpen={!!commentToDelete}
        title="Удалить комментарий?"
        message="Это действие нельзя отменить. Комментарий будет удален."
        confirmText="Удалить"
        loading={isDeletingComment}
        onClose={() => setCommentToDelete(null)}
        onConfirm={() => {
          if (commentToDelete) {
            void deleteComment(commentToDelete.id, commentToDelete.parentId);
          }
        }}
      />
    </>,
    document.body,
  );
}
