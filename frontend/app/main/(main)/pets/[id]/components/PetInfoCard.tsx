'use client';

import { Pet } from '../../../../../../lib/api';
import { UserIcon, MapPinIcon, HeartIcon, ShieldCheckIcon, CheckCircleIcon } from '@heroicons/react/24/outline'; // Added more icons

interface PetInfoCardProps {
  pet: Pet;
  age: string | null;
}

export default function PetInfoCard({ pet, age }: PetInfoCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 mb-2.5">
      <h3 className="text-lg font-bold text-gray-900 mb-3">Информация о питомце</h3>
      
      <div className="grid grid-cols-2 gap-2.5">
        {/* Возраст */}
        {age && (
          <div className="bg-orange-50/60 border border-orange-100/60 rounded-xl p-3 flex flex-col gap-1 hover:bg-orange-50 transition-colors">
            <div className="flex items-center gap-1.5 text-orange-500/80 mb-0.5">
              <div className="w-4 h-4 flex items-center justify-center font-medium">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">Возраст</span>
            </div>
            <div className="font-semibold text-gray-900 text-[13px] leading-tight">{age}</div>
          </div>
        )}

        {/* Порода */}
        <div className="bg-purple-50/60 border border-purple-100/60 rounded-xl p-3 flex flex-col gap-1 hover:bg-purple-50 transition-colors">
          <div className="flex items-center gap-1.5 text-purple-600/70 mb-0.5">
            <HeartIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Порода</span>
          </div>
          <div className="font-semibold text-gray-900 text-[13px] leading-tight truncate">
            {pet.breed_name || pet.breed || pet.species || 'Без породы'}
          </div>
        </div>

        {/* Пол */}
        <div className="bg-blue-50/60 border border-blue-100/60 rounded-xl p-3 flex flex-col gap-1 hover:bg-blue-50 transition-colors">
          <div className="flex items-center gap-1.5 text-blue-600/70 mb-0.5">
            <UserIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Пол</span>
          </div>
          <div className="font-semibold text-gray-900 text-[13px] leading-tight">
            {pet.gender === 'male' ? 'Мальчик' : pet.gender === 'female' ? 'Девочка' : 'Не указано'}
          </div>
        </div>

        {/* Город */}
        {(pet.location_address || pet.city || pet.region) && (
          <div className="bg-red-50/60 border border-red-100/60 rounded-xl p-3 flex flex-col gap-1 hover:bg-red-50 transition-colors">
            <div className="flex items-center gap-1.5 text-red-500/80 mb-0.5">
              <MapPinIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Город</span>
            </div>
            <div className="font-semibold text-gray-900 text-[13px] leading-tight truncate">
              {(pet.location_address || pet.city || pet.region || '').split(',')[0]}
            </div>
          </div>
        )}

        {/* Стерилизация */}
        <div className="bg-teal-50/60 border border-teal-100/60 rounded-xl p-3 flex flex-col gap-1 hover:bg-teal-50 transition-colors">
          <div className="flex items-center gap-1.5 text-teal-600/70 mb-0.5">
            <CheckCircleIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Стерилизация</span>
          </div>
          <div className="font-semibold text-gray-900 text-[13px] leading-tight line-clamp-2">
            {pet.is_sterilized ? 'Стерилизован' : 'Нет'}
          </div>
        </div>

        {/* Чип */}
        <div className="bg-indigo-50/60 border border-indigo-100/60 rounded-xl p-3 flex flex-col gap-1 hover:bg-indigo-50 transition-colors">
          <div className="flex items-center gap-1.5 text-indigo-500/80 mb-0.5">
            <ShieldCheckIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Чип</span>
          </div>
          <div className="font-semibold text-gray-900 text-[13px] leading-tight line-clamp-2">
            {pet.chip_number ? `Да` : 'Нет'}
          </div>
        </div>

      </div>
    </div>
  );
}
