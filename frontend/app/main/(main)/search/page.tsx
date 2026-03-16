'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import PostCard from '@/components/main/posts/PostCard';
import PetCard from '@/components/main/pets/PetCard';
import Link from 'next/link';
import Image from 'next/image';

interface SearchResults {
  users: Array<{
    id: number;
    first_name: string;
    last_name: string;
    avatar_url: string;
    is_verified: boolean;
  }>;
  pets: Array<any>;
  posts: Array<any>;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get('q') || '';
  
  const [results, setResults] = useState<SearchResults>({ users: [], pets: [], posts: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!q.trim()) {
      setIsLoading(false);
      return;
    }

    const fetchSearch = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient.get<{ success: boolean; data: SearchResults }>(`/search?q=${encodeURIComponent(q)}`);
        
        // Debugging the response block to ensure API data flows correctly
        if (response.data && response.data.success && response.data.data) {
          setResults(response.data.data);
        } else {
            console.error("Invalid search response:", response);
            setError("Не удалось загрузить результаты поиска.");
        }
      } catch (err) {
        console.error('Search error:', err);
        setError("Ошибка при поиске.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSearch();
  }, [q]);

  if (!q.trim()) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center text-gray-500">
        Введите запрос для поиска.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Найдено по запросу &quot;{q}&quot;</h1>
        {!isLoading && results.users.length === 0 && results.pets.length === 0 && results.posts.length === 0 && (
          <p className="text-gray-500 mt-4">К сожалению, ничего не найдено.</p>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
           <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="text-red-500 text-center py-8">{error}</div>
      ) : (
        <>
          {/* Блок пользователей */}
          {results.users.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold border-b pb-2">Пользователи</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {results.users.map((user) => (
                  <Link href={`/main/${user.id}`} key={user.id} className="flex items-center space-x-3 p-3 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition-shadow">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                      {user.avatar_url ? (
                        <Image src={user.avatar_url} alt={user.first_name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 font-medium pb-1">
                          {user.first_name?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{user.first_name} {user.last_name}</div>
                      <div className="text-sm text-gray-500 hover:text-blue-500 transition-colors">Перейти в профиль</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Блок питомцев */}
          {results.pets.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold border-b pb-2">Питомцы</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {results.pets.map((pet) => (
                  <PetCard key={pet.id} pet={pet} />
                ))}
              </div>
            </div>
          )}

          {/* Блок записей */}
          {results.posts.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold border-b pb-2">Записи</h2>
              <div className="space-y-4">
                {results.posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
