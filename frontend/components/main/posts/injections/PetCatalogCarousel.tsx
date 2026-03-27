'use client';

import Link from 'next/link';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';

interface Pet {
  id: number;
  name: string;
  species: string;
  breed?: string;
  photo?: string;
  status: string;
  city?: string;
  region?: string;
}

export default function PetCatalogCarousel({ index = 0 }: { index?: number }) {
  const { data: lookingForHome, isLoading } = useQuery({
    queryKey: ['injected-pet-catalog'],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/pets/catalog`);
      const result = await response.json();
      if (result.success && result.data) {
        return result.data.filter((p: Pet) => p.status === 'looking_for_home');
      }
      return [];
    },
    staleTime: 1000 * 60 * 5, // Кэшируем на 5 минут чтобы не спамить API кучей одинаковых виджетов
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-0 mb-4 overflow-hidden">
        <div className="w-full h-[300px] bg-gray-200 animate-pulse" />
        <div className="p-4">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-3" />
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!lookingForHome || lookingForHome.length === 0) return null;

  // Выбираем питомца детерминированно на основе индекса блока (чтобы избежать дубликатов на одной странице)
  const featuredPet = lookingForHome[index % lookingForHome.length];

  if (!featuredPet) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-4 overflow-hidden group hover:shadow-md transition-all">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 flex items-center justify-between">
         <div className="flex items-center gap-2 text-white">
            <span className="text-lg leading-none">✨</span>
            <span className="font-bold text-sm tracking-wide">ПИТОМЕЦ ДНЯ</span>
         </div>
         <Link href="/catalog" className="text-xs font-semibold text-white/90 hover:text-white bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors">
            В каталог
         </Link>
      </div>

      <Link href={`/pets/${featuredPet.id}`} className="block relative w-full aspect-square sm:aspect-[4/3] bg-gray-100 overflow-hidden">
        {featuredPet.photo ? (
          <img
            src={featuredPet.photo}
            alt={featuredPet.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center transition-transform duration-700 group-hover:scale-105">
            <span className="text-8xl opacity-30 drop-shadow-sm pb-10">
              {featuredPet.species === 'Собака' && '🐕'}
              {featuredPet.species === 'Кошка' && '🐈'}
              {featuredPet.species === 'Птица' && '🐦'}
              {!['Собака', 'Кошка', 'Птица'].includes(featuredPet.species) && '🐾'}
            </span>
          </div>
        )}
        
        {/* Gradient Overlay bottom to top */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent pointer-events-none" />

        {/* Pet Info Content inside image */}
        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
          <div className="flex items-end justify-between">
            <div className="min-w-0 pr-4">
              <h3 className="text-3xl font-extrabold mb-1 drop-shadow-sm truncate">
                {featuredPet.name}
              </h3>
              <p className="text-[15px] font-medium text-gray-200 truncate mb-3">
                {featuredPet.breed || 'Без породы'}
              </p>
              
              <div className="flex items-center gap-1.5 text-sm font-medium text-gray-300">
                <MapPinIcon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{(featuredPet.city || featuredPet.region || 'Город не указан').split(',')[0]}</span>
              </div>
            </div>

            <div className="flex-shrink-0 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-lg transition-transform hover:-translate-y-0.5">
              Взять домой
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
