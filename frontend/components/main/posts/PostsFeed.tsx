'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { postsApi } from '@/lib/api/posts';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import Link from 'next/link';
import PostCard from './PostCard';
import CreatePost from './CreatePost';
import PostSkeleton from './PostSkeleton';
import PetCatalogCarousel from './injections/PetCatalogCarousel';
import PromoActionCard from './injections/PromoActionCard';

interface PostsFeedProps {
  activeFilter?: 'for-you' | 'following' | 'city' | 'lost' | 'found' | 'looking-for-home';
  initialPostId?: number; // ✅ ID поста для открытия модального окна
}

export default function PostsFeed({ activeFilter = 'for-you' }: PostsFeedProps) {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();
  const observerTarget = useRef<HTMLDivElement>(null);

  const filterParam = activeFilter === 'for-you' ? undefined : activeFilter;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['posts', activeFilter],
    queryFn: async ({ pageParam = 0 }) => {
      const limit = 10; // Load 10 posts per scroll
      // pageParam выступает в роли offset
      let response = await postsApi.getAll({ limit, offset: pageParam, filter: filterParam });
      let isFallback = false;
      
      // Fallback logic for 'city' cold start
      if (pageParam === 0 && activeFilter === 'city' && (!response.data || response.data.length === 0)) {
         response = await postsApi.getAll({ limit, offset: pageParam, filter: undefined });
         isFallback = true;
      }
      
      if (!response.data) throw new Error('No data');
      return {
        posts: response.data,
        isFallback
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.posts.length < 10) return undefined;
      return allPages.length * 10; // next offset = pages count * limit
    },
    // Убираем жесткое ожидание isAuthenticated, чтобы гости тоже загружали ленту
    enabled: !isAuthLoading,
  });

  // Extract posts and fallback flag
  const isFallbackActivated = data?.pages[0]?.isFallback === true;
  const posts = data?.pages.flatMap(page => page.posts) || [];
  
  // Merge posts with contextual widgets for native feed injection
  const feedItems: Array<{ type: 'post' | 'catalog' | 'promo'; data?: any; id: string; widgetIndex?: number }> = [];
  posts.forEach((post, index) => {
    feedItems.push({ type: 'post', data: post, id: `post-${post.id}` });
    
    // Inject catalog carousel every 7 posts (indices 1, 8, 15, 22...)
    if (index % 7 === 1) {
      const widgetIndex = Math.floor(index / 7);
      feedItems.push({ type: 'catalog', id: `widget-catalog-${widgetIndex}`, widgetIndex });
    }
    
    // Inject promo card once after the 6th post
    if (index === 5) {
      feedItems.push({ type: 'promo', id: 'widget-promo' });
    }
  });

  const parentRef = useRef<HTMLDivElement>(null);
  const parentOffsetRef = useRef(0);
  const [scrollMargin, setScrollMargin] = useState(0);

  useEffect(() => {
    parentOffsetRef.current = parentRef.current?.offsetTop ?? 0;
    setScrollMargin(parentOffsetRef.current);
  }, []);

  const virtualizer = useWindowVirtualizer({
    count: feedItems.length,
    estimateSize: (index) => {
      const item = feedItems[index];
      if (item.type === 'catalog') return 400;
      if (item.type === 'promo') return 200;
      return 600; // default post height (increased for better prediction)
    },
    overscan: 5, // Rent more off-screen elements to prevent flashing
    scrollMargin,
  });

  // Infinite scroll intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }
    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleDeletePost = (postId: number) => {
    queryClient.setQueryData(['posts', activeFilter], (oldData: any) => {
      if (!oldData || !oldData.pages) return oldData;

      return {
        ...oldData,
        pages: oldData.pages.map((page: any) => ({
          ...page,
          posts: page.posts.filter((post: any) => post.id !== postId),
        })),
      };
    });
  };

  const handleUpdatePost = async (postId: number) => {
    try {
      await postsApi.getPostByID?.(postId); // Safe call, but better refetching all
      refetch();
    } catch {
      refetch();
    }
  };



  return (
    <div className="space-y-2.5">
      {/* Create Post - только для авторизованных (не показываем пока загрузка) */}
      {!isAuthLoading && isAuthenticated && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <CreatePost onPostCreated={() => refetch()} />
        </div>
      )}

      {/* Posts */}
      {isAuthLoading || isLoading ? (
        <div className="space-y-2.5">
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow-sm border border-gray-200">
          <p>Пока нет постов</p>
          {isAuthenticated && <p className="text-sm mt-2">Создайте первый пост!</p>}
        </div>
      ) : (
        <>
          {/* Fallback Banner for Empty City */}
          {isFallbackActivated && activeFilter === 'city' && (
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-4 flex items-start gap-3 shadow-sm">
              <span className="text-2xl leading-none">🏙️</span>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">В вашем городе пока тихо</h4>
                <p className="text-[13px] text-gray-600 mt-0.5">
                  Мы загрузили для вас глобальную ленту. Станьте первым, кто опубликует пост в своем регионе!
                </p>
              </div>
            </div>
          )}

          <div ref={parentRef}>
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const item = feedItems[virtualRow.index];
                return (
                  <div
                    key={item.id}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      paddingBottom: '16px',
                      transform: `translateY(${
                        virtualRow.start - virtualizer.options.scrollMargin
                      }px)`,
                    }}
                  >
                    {item.type === 'post' && (
                      <PostCard
                        post={item.data}
                        onDelete={handleDeletePost}
                        onUpdate={handleUpdatePost}
                      />
                    )}
                    {item.type === 'catalog' && <PetCatalogCarousel index={item.widgetIndex} />}
                    {item.type === 'promo' && <PromoActionCard />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Элемент для наблюдения (infinite scroll trigger) */}
          <div ref={observerTarget} className="py-6 flex flex-col items-center justify-center w-full min-h-[100px]">
            {isFetchingNextPage && (
              <div className="flex space-x-2 items-center justify-center">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}
            {!hasNextPage && posts.length > 0 && (
              <p className="text-sm text-gray-400 font-medium">Все посты загружены 🎉</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
