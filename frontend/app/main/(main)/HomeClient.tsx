'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, Search, ShieldCheck, Sparkles, LogIn, Info } from 'lucide-react';
import PostsFeed from '../../../components/main/posts/PostsFeed';
import FeedFilters from '../../../components/main/posts/FeedFilters';

type FilterType = 'for-you' | 'following' | 'city';

type Props = {
  searchParams: { metka?: string };
};

export default function HomeClient({ searchParams }: Props) {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FilterType>('for-you');

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      {/* Main Feed Column */}
      <div className="w-full lg:max-w-[700px] lg:flex-shrink-0 xl:w-[600px] flex flex-col gap-6">
        
        {/* Guest Hero Block (Post Style) */}
        {!isLoading && !isAuthenticated && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md p-6 sm:p-8 flex flex-col relative overflow-hidden transition-all duration-300">
            {/* Header like a Post profile */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-[18px] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Sparkles className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-[15px] sm:text-[16px]">ЗооПлатформа 3.0</h3>
                <p className="text-[13px] text-gray-500 font-medium">Официальный проект</p>
              </div>
            </div>
            
            <div className="mb-8">
              <h1 className="text-[24px] sm:text-[32px] font-extrabold text-gray-900 mb-4 leading-[1.2] tracking-tight">
                Единая цифровая среда<br className="hidden sm:block"/> для животных и людей
              </h1>
              <p className="text-[15px] sm:text-[16px] text-gray-600 leading-[1.6] max-w-[540px]">
                Первая экосистема, объединяющая любящих владельцев, волонтеров, приюты, клиники и государство. Наша главная цель — ответственное обращение и безопасные улицы без бездомных животных.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 mt-auto">
              <Link href="/main/catalog" className="flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-2xl font-bold shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:bg-blue-700 active:scale-95 transition-all duration-300 w-full sm:w-auto">
                <Search className="w-5 h-5 stroke-[2.5]" />
                <span>Искать друга</span>
              </Link>
              <Link href="/about" className="flex items-center justify-center gap-2 bg-gray-50 text-gray-700 border border-gray-200 px-5 py-3 rounded-2xl font-bold hover:bg-gray-100 hover:text-gray-900 active:scale-95 transition-all duration-300 w-full sm:w-auto">
                <Info className="w-5 h-5" />
                <span>О проекте</span>
              </Link>
              <Link href="/main/auth" className="flex items-center justify-center gap-2 bg-gray-50 text-gray-700 border border-gray-200 px-5 py-3 rounded-2xl font-bold hover:bg-gray-100 hover:text-gray-900 active:scale-95 transition-all duration-300 w-full sm:w-auto">
                <LogIn className="w-5 h-5" />
                <span>Войти</span>
              </Link>
            </div>
          </div>
        )}

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

          {/* Promo Block - Post Style */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex flex-col relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-bold text-gray-900 mb-4 text-[15px] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                Все сервисы
              </h3>
              
              <div className="space-y-2.5">
                <Link href="/owner" className="group flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg text-[14px] font-medium text-gray-700 hover:text-blue-700 hover:bg-white hover:shadow-sm border border-gray-100 hover:border-gray-200 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-white border border-gray-100 text-blue-600 transition-colors">
                      <Heart className="w-4 h-4" />
                    </div>
                    <span>Для Владельца</span>
                  </div>
                  <span className="text-gray-300 group-hover:text-blue-500 font-bold transition-colors">→</span>
                </Link>
                
                <Link href="/pethelper" className="group flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg text-[14px] font-medium text-gray-700 hover:text-indigo-700 hover:bg-white hover:shadow-sm border border-gray-100 hover:border-gray-200 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-white border border-gray-100 text-indigo-600 transition-colors">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span>Для Волонтера</span>
                  </div>
                  <span className="text-gray-300 group-hover:text-indigo-500 font-bold transition-colors">→</span>
                </Link>
                
                <Link href="/zooassistant" className="group flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg text-[14px] font-medium text-gray-700 hover:text-purple-700 hover:bg-white hover:shadow-sm border border-gray-100 hover:border-gray-200 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-white border border-gray-100 text-purple-600 transition-colors">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span>AI ЗооПомощник</span>
                  </div>
                  <span className="text-gray-300 group-hover:text-purple-500 font-bold transition-colors">→</span>
                </Link>
              </div>
              
              <div className="mt-5 text-center">
                <Link href="/services" className="inline-block px-3 py-1 text-[13px] text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg font-medium transition-colors">
                  Смотреть все модули платформы
                </Link>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
