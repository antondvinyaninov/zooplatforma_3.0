'use client';

import { useState, useEffect, memo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { UserIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { Pencil, Trash2 } from 'lucide-react';
import { getMediaUrl, getFullName } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, postsApi } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import MiniMap from '../shared/MiniMap';
import PostModal from './PostModal';
import PollDisplay from '../polls/PollDisplay';
import PhotoGrid from './PhotoGrid';
import LikersModal from './LikersModal';
import LikersTooltip from './LikersTooltip';
import PetCard from './PetCard';
import ReportButton from './ReportButton';
import CreatePost from './CreatePost';
import AuthModal from '../shared/AuthModal';
import ConfirmModal from '../shared/ConfirmModal';
import { useLongPress } from '../../../hooks/useLongPress';

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
  breed?: string;
  gender?: string;
  birth_date?: string;
  color?: string;
  size?: string;
  photo?: string;
  status?: string;
  city?: string;
  region?: string;
  urgent?: boolean;
  story?: string;
  organization_name?: string;
  organization_type?: string;
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

interface Organization {
  id: number;
  name: string;
  short_name?: string;
  logo?: string;
  type?: string;
}

interface Post {
  id: number;
  author_id: number;
  author_type: string;
  content: string;
  attached_pets: number[];
  attachments: Attachment[];
  user_reaction?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  user?: User;
  organization?: Organization;
  pets?: Pet[];
  poll?: Poll;
  has_poll?: boolean;
  comments_count: number;
  likes_count?: number;
  liked?: boolean;
  can_edit?: boolean; // ✅ Добавлено поле can_edit из Backend
  location_lat?: number;
  location_lon?: number;
  location_name?: string;
  reply_setting?: string;
  verify_replies?: boolean;
}

interface PostCardProps {
  post: Post;
  onDelete?: (postId: number) => void;
  onUpdate?: (postId: number) => void;
}

function PostCard({ post, onDelete, onUpdate }: PostCardProps) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showMenu, setShowMenu] = useState(false);
  const [isLiked, setIsLiked] = useState(post.liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [selectedReaction, setSelectedReaction] = useState<string | null>(post.user_reaction || null);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);
  const [showModal, setShowModal] = useState(false);
  const [showLikersModal, setShowLikersModal] = useState(false);
  const [showLikersTooltip, setShowLikersTooltip] = useState(false);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showEditMode, setShowEditMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const menuDropdownRef = useRef<HTMLDivElement | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

  // ✅ Ленивая загрузка опросов
  const [poll, setPoll] = useState<Poll | null>(post.poll || null);
  const [pollLoading, setPollLoading] = useState(false);
  const [pollLoaded, setPollLoaded] = useState(!!post.poll);

  // ✅ Используем can_edit из Backend вместо локальной проверки
  const canEditPost = post.can_edit || false;

  // Открываем модал если в URL есть параметр metka с ID этого поста
  useEffect(() => {
    const metkaId = searchParams.get('metka');
    if (metkaId && parseInt(metkaId) === post.id) {
      setShowModal(true);
    }
  }, [searchParams, post.id]);

  const loadPoll = useCallback(async () => {
    try {
      setPollLoading(true);
      const response = await apiClient.get<Poll>(`/api/polls/post/${post.id}`);
      if (response.success && response.data) {
        setPoll(response.data);
      }
    } catch (error) {
      console.error(`Error loading poll for post ${post.id}:`, error);
    } finally {
      setPollLoading(false);
      setPollLoaded(true);
    }
  }, [post.id]);

  // ✅ Ленивая загрузка опроса при появлении поста на экране
  useEffect(() => {
    if (pollLoaded || !post.has_poll) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !pollLoaded && !pollLoading) {
            loadPoll();
          }
        });
      },
      { threshold: 0.1 },
    );

    const element = document.getElementById(`post-${post.id}`);
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [post.id, post.has_poll, pollLoaded, pollLoading, loadPoll]);

  // Обновляем состояние когда меняются данные поста
  useEffect(() => {
    setIsLiked(post.liked || false);
    setLikesCount(post.likes_count || 0);
    setSelectedReaction(post.user_reaction || null);
  }, [post.liked, post.likes_count, post.user_reaction]);

  // Закрываем меню по клику вне кнопки/меню
  useEffect(() => {
    if (!showMenu) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedButton = menuButtonRef.current?.contains(target);
      const clickedDropdown = menuDropdownRef.current?.contains(target);
      if (!clickedButton && !clickedDropdown) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showMenu]);

  const updateMenuPosition = useCallback(() => {
    if (!menuButtonRef.current) return;
    const rect = menuButtonRef.current.getBoundingClientRect();
    const menuWidth = 240;
    const viewportPadding = 8;
    const left = Math.max(
      viewportPadding,
      Math.min(window.innerWidth - menuWidth - viewportPadding, rect.right - menuWidth),
    );
    setMenuPosition({
      top: rect.bottom + 8,
      left,
    });
  }, []);

  useEffect(() => {
    if (!showMenu) return;
    updateMenuPosition();

    const onReposition = () => updateMenuPosition();
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);

    return () => {
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [showMenu, updateMenuPosition]);

  const toggleLikeMutation = useMutation({
    mutationFn: (args: {postId: number, reactionType?: string}) => postsApi.toggleLike(args.postId, args.reactionType),
    onMutate: async (args) => {
      // Прерываем старые запросы, чтобы они не переписали наше оптимистичное обновление
      await queryClient.cancelQueries({ queryKey: ['posts'] });

      const wasLiked = isLiked;
      const oldCount = likesCount;
      const oldReaction = selectedReaction;

      // Оптимистичное обновление
      const isUnliking = wasLiked && (!args.reactionType || args.reactionType === oldReaction);
      
      setIsLiked(!isUnliking);
      setSelectedReaction(isUnliking ? null : (args.reactionType || 'like'));
      
      if (isUnliking) {
        setLikesCount(Math.max(0, oldCount - 1));
      } else if (!wasLiked) {
        setLikesCount(oldCount + 1);
        setShowLikeAnimation(true);
        setTimeout(() => setShowLikeAnimation(false), 1000);
      }

      // Обновляем все закешированные списки постов (глобально)
      queryClient.setQueriesData({ queryKey: ['posts'] }, (oldData: unknown) => {
        if (!oldData) return oldData;

        if (
          typeof oldData === 'object' &&
          oldData !== null &&
          'pages' in oldData &&
          Array.isArray((oldData as { pages: unknown[] }).pages)
        ) {
          const typedData = oldData as { pages: unknown[] };

          return {
            ...typedData,
            pages: typedData.pages.map((page) => {
              if (Array.isArray(page)) {
                return (page as Post[]).map((p) => {
                  if (p.id === args.postId) {
                    return {
                      ...p,
                      liked: !isUnliking,
                      likes_count: isUnliking
                        ? Math.max(0, (p.likes_count || 0) - 1)
                        : !wasLiked
                          ? (p.likes_count || 0) + 1
                          : p.likes_count,
                    };
                  }
                  return p;
                });
              }

              if (
                typeof page === 'object' &&
                page !== null &&
                'data' in page &&
                Array.isArray((page as { data: unknown[] }).data)
              ) {
                const typedPage = page as { data: Post[] };
                return {
                  ...typedPage,
                  data: typedPage.data.map((p) => {
                    if (p.id === args.postId) {
                      return {
                        ...p,
                        liked: !isUnliking,
                        likes_count: isUnliking
                          ? Math.max(0, (p.likes_count || 0) - 1)
                          : !wasLiked
                            ? (p.likes_count || 0) + 1
                            : p.likes_count,
                      };
                    }
                    return p;
                  }),
                };
              }

              return page;
            }),
          };
        }

        if (Array.isArray(oldData)) {
          return oldData.map((p: Post) => {
            if (p.id === args.postId) {
              return {
                ...p,
                liked: !isUnliking,
                likes_count: isUnliking
                  ? Math.max(0, (p.likes_count || 0) - 1)
                  : !wasLiked
                    ? (p.likes_count || 0) + 1
                    : p.likes_count,
              };
            }
            return p;
          });
        }

        return oldData;
      });

      return { wasLiked, oldCount, oldReaction };
    },
    onError: (err, variables, context) => {
      // Откат изменений при ошибке сети
      if (context) {
        setIsLiked(context.wasLiked);
        setLikesCount(context.oldCount);
        setSelectedReaction(context.oldReaction);
      }
    },
    onSettled: () => {
      // Можно было бы запросить новую стату, но для лайков обычно хватает UI + Mutation result
    },
  });

  const handleLike = (reactionType?: string, e?: React.SyntheticEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    if (toggleLikeMutation.isPending) {
      return;
    }

    toggleLikeMutation.mutate({ postId: post.id, reactionType });
  };

  const handleMouseEnterTooltip = () => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    setShowLikersTooltip(true);
  };

  const handleMouseLeaveTooltip = () => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    tooltipTimeoutRef.current = setTimeout(() => {
      setShowLikersTooltip(false);
    }, 300);
  };

  const handleDoubleClick = () => {
    if (!isLiked) {
      handleLike();
    }
  };

  const handleShare = async (type: 'copy' | 'vk' | 'telegram' | 'whatsapp') => {
    const postUrl = `${window.location.origin}/?metka=${post.id}`;
    const text = post.content.substring(0, 100) + (post.content.length > 100 ? '...' : '');

    switch (type) {
      case 'copy':
        try {
          await navigator.clipboard.writeText(postUrl);
          setShareMessage('Ссылка скопирована!');
          setTimeout(() => setShareMessage(''), 2000);
        } catch (error) {
          console.error('Ошибка копирования:', error);
        }
        break;
      case 'vk':
        window.open(
          `https://vk.com/share.php?url=${encodeURIComponent(postUrl)}&title=${encodeURIComponent(text)}`,
          '_blank',
        );
        break;
      case 'telegram':
        window.open(
          `https://t.me/share/url?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(text)}`,
          '_blank',
        );
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + postUrl)}`, '_blank');
        break;
    }
    setShowShareMenu(false);
  };

  const handleOpenModal = () => {
    setShowModal(true);
    // Используем window.history.pushState чтобы не триггерить router
    const url = new URL(window.location.href);
    url.searchParams.set('metka', post.id.toString());
    window.history.pushState({}, '', url.toString());
  };

  const handleCloseModal = () => {
    setShowModal(false);
    // Убираем параметр metka из URL без триггера router
    const url = new URL(window.location.href);
    url.searchParams.delete('metka');
    window.history.pushState({}, '', url.toString());
  };

  const handleDeletePost = async () => {
    if (isDeletingPost) return;

    setIsDeletingPost(true);
    const currentScroll = window.scrollY;

    try {
      const response = await postsApi.delete(post.id);

      if (response.success) {
        if (onDelete) {
          onDelete(post.id);

          // Восстанавливаем позицию скролла через 10ms (прокрутка происходит между 0-10ms)
          setTimeout(() => {
            if (window.scrollY !== currentScroll) {
              window.scrollTo(0, currentScroll);
            }
          }, 10);
        }
      } else {
        alert('Ошибка при удалении поста');
      }
    } catch (error) {
      console.error('Ошибка удаления поста:', error);
      alert('Ошибка при удалении поста');
    }
    setIsDeletingPost(false);
    setShowDeleteConfirm(false);
    setShowMenu(false);
  };

  const handleEditPost = async () => {
    if (post.has_poll && !poll && !pollLoading) {
      await loadPoll();
    }
    setShowEditMode(true);
    setShowMenu(false);
  };

  const handlePostUpdated = () => {
    setShowEditMode(false);

    // Обновляем пост локально без перезагрузки страницы
    if (onUpdate) {
      onUpdate(post.id);
    } else {
      // Fallback: перезагружаем страницу если onUpdate не передан
      window.location.reload();
    }
  };

  const getTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ru });
    } catch {
      return 'недавно';
    }
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
    (e: React.TouchEvent | React.MouseEvent) => {
      // При коротком нажатии ставим обычный лайк (или убираем)
      handleLike(undefined, e);
    },
    { delay: 400 } // 400ms для лонг-пресса
  );

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

  return (
    <div
      id={`post-${post.id}`}
      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex items-start justify-between p-4 pb-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            onClick={() => {
              if (post.author_type === 'organization' && post.organization) {
                router.push(`/org/${post.organization.id}`);
              } else if (post.author_type === 'user' && post.user) {
                router.push(`/id${post.user.id}`);
              }
            }}
            className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-semibold overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
          >
            {post.author_type === 'organization' ? (
              post.organization?.logo ? (
                <Image
                  src={getMediaUrl(post.organization.logo) || ''}
                  alt={post.organization.name}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon className="w-6 h-6 text-gray-500" />
              )
            ) : (post.user?.avatar_url || post.user?.avatar) ? (
              <Image
                src={getMediaUrl(post.user?.avatar_url || post.user?.avatar) || ''}
                alt={post.user?.first_name || post.user?.name || 'User'}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <UserIcon className="w-6 h-6 text-gray-500" />
            )}
          </div>

          {/* User Info */}
          <div>
            <div
              onClick={() => {
                if (post.author_type === 'organization' && post.organization) {
                  router.push(`/org/${post.organization.id}`);
                } else if (post.author_type === 'user' && post.user) {
                  router.push(`/id${post.user.id}`);
                }
              }}
              className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
            >
              {post.author_type === 'organization'
                ? post.organization?.short_name || post.organization?.name || 'Организация'
                : getFullName(post.user?.first_name || post.user?.name || 'Пользователь', post.user?.last_name)}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{getTimeAgo(post.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Menu Button */}
        <div className="relative">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowMenu((prev) => {
                const next = !prev;
                if (next) {
                  requestAnimationFrame(() => updateMenuPosition());
                }
                return next;
              });
            }}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
          </button>

        </div>
      </div>

      {showMenu &&
        menuPosition &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuDropdownRef}
            className="fixed w-60 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-[120]"
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            {canEditPost && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleEditPost();
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700 transition-colors"
                >
                  <Pencil className="w-5 h-5 text-blue-500" />
                  <span>Редактировать</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowDeleteConfirm(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-red-600 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                  <span>Удалить</span>
                </button>
                <div className="border-t border-gray-200 my-2"></div>
              </>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowReportModal(true);
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700 transition-colors"
            >
              <svg
                className="w-5 h-5 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                />
              </svg>
              <span>Пожаловаться</span>
            </button>
          </div>,
          document.body,
        )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex gap-2 px-4 pb-3">
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
      <div
        className="text-gray-900 px-4 pb-3 whitespace-pre-wrap relative"
        onDoubleClick={handleDoubleClick}
      >
        {post.content}

        {/* Like Animation */}
        {showLikeAnimation && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg className="w-24 h-24 text-red-500 fill-current animate-ping" viewBox="0 0 24 24">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
        )}
      </div>

      {/* Location - мини-карта */}
      {post.location_lat && post.location_lon && (
        <div className="px-4 pb-3">
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <MiniMap
              lat={post.location_lat}
              lon={post.location_lon}
              locationName={post.location_name}
              height="150px"
            />
            {post.location_name && (
              <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 flex items-center gap-2">
                <MapPinIcon className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">{post.location_name}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Photos/Videos */}
      {post.attachments && post.attachments.length > 0 && (
        <div className="pb-3">
          <PhotoGrid
            photos={post.attachments.filter(
              (a) =>
                a.type === 'image' ||
                a.type === 'video' ||
                a.media_type === 'image' ||
                a.media_type === 'video',
            )}
            onClick={handleOpenModal}
          />
        </div>
      )}

      {/* Poll - ленивая загрузка */}
      {(() => {
        if (poll) {
          return (
            <div className="px-4 pb-3">
              <PollDisplay poll={poll} />
            </div>
          );
        } else if (post.has_poll) {
          return <div className="px-4 pb-3 text-gray-500">Загрузка опроса...</div>;
        }
        return null;
      })()}

      {/* Attached Pets */}
      {post.pets && Array.isArray(post.pets) && post.pets.length > 0 && (
        <div className="space-y-3 px-4 pb-3">
          {post.pets
            .filter((pet) => pet && pet.id && pet.name)
            .map((pet) => (
              <PetCard key={pet.id} pet={pet} />
            ))}
        </div>
      )}

      {/* Actions */}
      {isAuthenticated && (
        <div className="flex items-center gap-6 text-gray-600 px-4 py-3 border-t border-gray-100">
          <div 
            className="relative flex items-center"
            onMouseEnter={handleMouseEnterTooltip}
            onMouseLeave={handleMouseLeaveTooltip}
          >
            <div className="flex items-center">
              {/* Кнопка Лайка (иконка) - с поддержкой долгого нажатия */}
              <button
                {...longPressEvent}
                className={`flex items-center gap-1 transition-colors p-1 -ml-1 ${isLiked && !selectedReaction ? 'text-red-500' : 'hover:text-red-500'}`}
                style={{ touchAction: 'manipulation' }}
              >
                {selectedReaction ? (
                  <span className="text-[20px] drop-shadow-sm leading-none flex items-center justify-center w-5 h-5 pointer-events-none">
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
                  <svg
                    className={`w-5 h-5 pointer-events-none ${isLiked ? 'fill-current' : ''}`}
                    fill={isLiked ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
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
                  className="text-sm font-medium hover:underline p-1"
                >
                  {likesCount}
                </button>
              )}
            </div>
            
            <LikersTooltip
              postId={post.id}
              isVisible={showLikersTooltip && !showLikersModal}
              totalLikes={likesCount}
              onMouseEnter={handleMouseEnterTooltip}
              onMouseLeave={handleMouseLeaveTooltip}
              onReaction={(type) => {
                if (isAuthenticated) {
                  handleLike(type); // handleLike сам разрулит Upsert
                } else {
                  setShowAuthModal(true);
                }
                setShowLikersTooltip(false);
              }}
              onLikersClick={() => {
                setShowLikersModal(true);
                setShowLikersTooltip(false);
              }}
            />

            {/* Likers Modal (on click) */}
            <LikersModal
              postId={post.id}
              isOpen={showLikersModal}
              onClose={() => setShowLikersModal(false)}
            />
          </div>

          <button
            onClick={handleOpenModal}
            className="flex items-center gap-2 hover:text-blue-500 transition-colors"
            title={
              post.reply_setting === 'followers' ? 'Только подписчики могут комментировать' :
              post.reply_setting === 'following' ? 'Только те, на кого подписан автор, могут комментировать' :
              'Комментировать'
            }
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
          </button>

          {/* Share Menu */}
          {showShareMenu && (
            <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[200px] z-10">
              <button
                onClick={() => handleShare('copy')}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Копировать ссылку
              </button>
              <button
                onClick={() => handleShare('vk')}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
              >
                <span className="text-blue-500 font-bold">VK</span>
                ВКонтакте
              </button>
              <button
                onClick={() => handleShare('telegram')}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
              >
                <span className="text-blue-400">✈️</span>
                Telegram
              </button>
              <button
                onClick={() => handleShare('whatsapp')}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
              >
                <span className="text-green-500">💬</span>
                WhatsApp
              </button>
            </div>
          )}

          {/* Share Message */}
          {shareMessage && (
            <div className="absolute bottom-full right-0 mb-2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap">
              {shareMessage}
            </div>
          )}
        </div>
      )}

      {/* Post Modal */}
      <PostModal
        post={post}
        isOpen={showModal}
        onClose={handleCloseModal}
        onCountChange={(count) => setCommentsCount(count)}
        initialIsLiked={isLiked}
        initialLikesCount={likesCount}
        onLikeChange={(liked, count) => {
          setIsLiked(liked);
          setLikesCount(count);
        }}
      />



      {/* Report Modal */}
      {showReportModal && (
        <ReportButton
          targetType="post"
          targetId={post.id}
          targetName={`Пост от ${post.author_type === 'organization' ? post.organization?.short_name || post.organization?.name : getFullName(post.user?.first_name || post.user?.name || '', post.user?.last_name)}`}
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {/* Edit Mode - используем CreatePost компонент */}
      {showEditMode &&
        typeof document !== 'undefined' &&
        createPortal(
          <CreatePost
            editMode={true}
            editPost={{
              id: post.id,
              content: post.content || '',
              attached_pets:
                Array.isArray(post.attached_pets) && post.attached_pets.length > 0
                  ? post.attached_pets
                  : Array.isArray(post.pets)
                    ? post.pets.map((pet) => pet.id).filter(Boolean)
                    : [],
              pets: post.pets,
              attachments: post.attachments,
              tags: post.tags,
              poll: poll || post.poll,
              location_lat: post.location_lat,
              location_lon: post.location_lon,
              location_name: post.location_name,
              reply_setting: post.reply_setting,
              verify_replies: post.verify_replies,
            }}
            onPostUpdated={handlePostUpdated}
          />,
          document.body,
        )}

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Удалить пост?"
        message="Это действие нельзя отменить. Пост будет удален из ленты."
        confirmText="Удалить"
        loading={isDeletingPost}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeletePost}
      />
    </div>
  );
}

// Оборачиваем в memo чтобы избежать лишних перерендеров
export default memo(PostCard, (prevProps, nextProps) => {
  // Перерендериваем только если изменился сам пост
  return (
    prevProps.post.id === nextProps.post.id &&
    prevProps.post.updated_at === nextProps.post.updated_at
  );
});
