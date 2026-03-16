'use client';

import { useState } from 'react';
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

      {/* Right Panel - только для авторизованных */}
      {(isLoading || isAuthenticated) && (
        <aside className="hidden lg:block lg:w-[280px] xl:w-[320px]">
          <div className="sticky top-[58px] space-y-2.5 pb-4">
            <FeedFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} />
            <RightPanel />
          </div>
        </aside>
      )}
    </div>
  );
}
