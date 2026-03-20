'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import PostsFeed from '../../../components/main/posts/PostsFeed';
import FeedFilters from '../../../components/main/posts/FeedFilters';
import RightPanel from '../../../components/main/layout/RightPanel';

type FilterType = 'for-you' | 'following' | 'city';

type Props = {
  searchParams: { metka?: string };
};

export default function HomeClient({ searchParams }: Props) {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FilterType>('for-you');

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      {/* Main Feed - оптимальная ширина */}
      <div className="w-full lg:max-w-[700px] lg:flex-shrink-0 xl:w-[600px]">
        <PostsFeed
          activeFilter={activeFilter}
          initialPostId={searchParams.metka ? parseInt(searchParams.metka) : undefined}
        />
      </div>

      {/* Right Panel - теперь доступна и для гостей для показа блока "Попробуйте" */}
      <aside className="hidden lg:block lg:w-[280px] xl:w-[320px]">
        <div className="sticky top-[58px] space-y-2.5 pb-4">
          {(isLoading || isAuthenticated) && (
            <FeedFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} />
          )}

          {/* Promo Block - Попробуйте */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-100 p-4">
            <h3 className="font-bold text-gray-900 mb-3 text-[15px]">Попробуйте сервисы платформы</h3>
            <div className="space-y-2">
              <Link href="/owner" className="flex items-center justify-between bg-white px-3 py-2.5 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors border border-blue-100/50 shadow-sm">
                <span>Кабинет владельца</span>
                <span className="text-blue-400 font-bold">→</span>
              </Link>
              <Link href="/pethelper" className="flex items-center justify-between bg-white px-3 py-2.5 rounded-lg text-sm font-medium text-indigo-700 hover:bg-indigo-50 transition-colors border border-indigo-100/50 shadow-sm">
                <span>Кабинет волонтера</span>
                <span className="text-indigo-400 font-bold">→</span>
              </Link>
              <Link href="/zooassistant" className="flex items-center justify-between bg-white px-3 py-2.5 rounded-lg text-sm font-medium text-purple-700 hover:bg-purple-50 transition-colors border border-purple-100/50 shadow-sm">
                <span>AI ЗооПомощник</span>
                <span className="text-purple-400 font-bold">→</span>
              </Link>
            </div>
            <div className="mt-4 text-center">
              <Link href="/services" className="text-xs text-gray-500 hover:text-blue-600 font-medium transition-colors">
                Все сервисы платформы
              </Link>
            </div>
          </div>

          {(isLoading || isAuthenticated) && <RightPanel />}
        </div>
      </aside>
    </div>
  );
}
