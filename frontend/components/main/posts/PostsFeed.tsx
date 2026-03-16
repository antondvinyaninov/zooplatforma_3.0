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
      const response = await postsApi.getAll({ limit, offset: pageParam, filter: filterParam });
      console.log('--- DEBUG POSTS API RESPONSE ---', response);
      if (!response.data) throw new Error('No data');
      return response.data; // Post[]
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // Бэкенд возвращает просто массив постов.
      // Если постов вернулось меньше, чем limit, значит это последняя страница
      if (lastPage.length < 10) return undefined;
      return allPages.length * 10; // next offset = pages count * limit
    },
    // Убираем жесткое ожидание isAuthenticated, чтобы гости тоже загружали ленту
    enabled: !isAuthLoading,
  });

  // FlatMap arrays since Data is now just Post[]
  const posts = data?.pages.flat() || [];

  const parentRef = useRef<HTMLDivElement>(null);
  const parentOffsetRef = useRef(0);
  const [scrollMargin, setScrollMargin] = useState(0);

  useEffect(() => {
    parentOffsetRef.current = parentRef.current?.offsetTop ?? 0;
    setScrollMargin(parentOffsetRef.current);
  }, []);

  const virtualizer = useWindowVirtualizer({
    count: posts.length,
    estimateSize: () => 400, // Примерная высота поста
    overscan: 3,
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
    queryClient.setQueryData(['posts', activeFilter], (oldData: unknown) => {
      if (!oldData) return oldData;

      if (
        typeof oldData !== 'object' ||
        oldData === null ||
        !('pages' in oldData) ||
        !Array.isArray((oldData as { pages: unknown[] }).pages)
      ) {
        return oldData;
      }

      const typedData = oldData as { pages: unknown[] };
      return {
        ...typedData,
        pages: typedData.pages.map((page) =>
          Array.isArray(page) ? page.filter((post) => post.id !== postId) : page,
        ),
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
          {activeFilter === 'city' ? (
            <>
              <p className="font-medium">Нет постов из вашего города</p>
              <p className="text-sm mt-2">
                Убедитесь, что вы указали свой город в профиле, и другие пользователи тоже указали
                свой город
              </p>
              <Link
                href="/owner/profile/edit"
                className="text-sm font-medium mt-3 inline-block"
                style={{ color: '#1B76FF' }}
              >
                Заполнить город в профиле →
              </Link>
            </>
          ) : (
            <>
              <p>Пока нет постов</p>
              {isAuthenticated && <p className="text-sm mt-2">Создайте первый пост!</p>}
            </>
          )}
        </div>
      ) : (
        <>
          <div ref={parentRef}>
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const post = posts[virtualRow.index];
                return (
                  <div
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      paddingBottom: '10px',
                      transform: `translateY(${
                        virtualRow.start - virtualizer.options.scrollMargin
                      }px)`,
                    }}
                  >
                    <PostCard
                      post={post}
                      onDelete={handleDeletePost}
                      onUpdate={handleUpdatePost}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Элемент для наблюдения (infinite scroll trigger) */}
          <div ref={observerTarget} className="h-10 flex items-center justify-center">
            {isFetchingNextPage && <PostSkeleton />}
            {!hasNextPage && posts.length > 0 && (
              <p className="text-sm text-gray-500 mt-4">Все посты загружены</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
