'use client';

import { SparklesIcon, UserGroupIcon, MapPinIcon } from '@heroicons/react/24/outline';

interface FeedFiltersProps {
  activeFilter: 'for-you' | 'following' | 'city';
  onFilterChange: (filter: 'for-you' | 'following' | 'city') => void;
}

export default function FeedFilters({ activeFilter, onFilterChange }: FeedFiltersProps) {
  const filters = [
    { id: 'for-you' as const, label: 'Для вас', icon: SparklesIcon },
    { id: 'following' as const, label: 'Подписки', icon: UserGroupIcon },
    { id: 'city' as const, label: 'Мой город', icon: MapPinIcon },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex flex-col">
      <h3 className="font-bold text-gray-900 mb-3 px-2 text-[15px]">Фильтры ленты</h3>
      <div className="space-y-1">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              activeFilter === filter.id
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
            }`}
          >
            <filter.icon 
              className={`w-5 h-5 flex-shrink-0 transition-colors ${activeFilter === filter.id ? 'text-blue-600' : 'text-gray-500'}`} 
              strokeWidth={activeFilter === filter.id ? 2.5 : 2} 
            />
            <span className="text-[14px]">{filter.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
