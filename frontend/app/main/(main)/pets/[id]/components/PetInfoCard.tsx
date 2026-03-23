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
      
      <div className="space-y-3">
        {/* Возраст */}
        {age && (
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
              <div className="w-5 h-5 flex items-center justify-center text-orange-500 font-medium">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="flex border-b border-gray-50 pb-2 w-full items-center">
              <div>
                <div className="text-xs text-gray-400 mb-0.5">Возраст</div>
                <div className="font-semibold text-gray-900 text-sm">{age}</div>
              </div>
            </div>
          </div>
        )}

        {/* Порода */}
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
            <HeartIcon className="w-5 h-5 text-purple-500" />
          </div>
          <div className="flex border-b border-gray-50 pb-2 w-full items-center">
            <div>
              <div className="text-xs text-gray-400 mb-0.5">Порода</div>
              <div className="font-semibold text-gray-900 text-sm">{pet.breed_name || pet.breed || pet.species || 'Без породы'}</div>
            </div>
          </div>
        </div>

        {/* Пол */}
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
            <UserIcon className="w-5 h-5 text-green-500" />
          </div>
          <div className="flex border-b border-gray-50 pb-2 w-full items-center">
            <div>
              <div className="text-xs text-gray-400 mb-0.5">Пол</div>
              <div className="font-semibold text-gray-900 text-sm">
                {pet.gender === 'male' ? 'Мальчик' : pet.gender === 'female' ? 'Девочка' : 'Не указан'}
              </div>
            </div>
          </div>
        </div>

        {/* Город */}
        {(pet.location_address || pet.city || pet.region) && (
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
              <MapPinIcon className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex border-b border-gray-50 pb-2 w-full items-center">
              <div>
                <div className="text-xs text-gray-400 mb-0.5">Город</div>
                <div className="font-semibold text-gray-900 text-sm">{(pet.location_address || pet.city || pet.region || '').split(',')[0]}</div>
              </div>
            </div>
          </div>
        )}

        {/* Стерилизация */}
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
            <CheckCircleIcon className="w-5 h-5 text-teal-500" />
          </div>
          <div className="flex border-b border-gray-50 pb-2 w-full items-center">
            <div>
              <div className="text-xs text-gray-400 mb-0.5">Стерилизация</div>
              <div className="font-semibold text-gray-900 text-sm">
                {pet.is_sterilized ? 'Стерилизован' : 'Не стерилизован'}
              </div>
            </div>
          </div>
        </div>

        {/* Чипирован */}
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
            <ShieldCheckIcon className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="flex border-b border-gray-50 pb-2 w-full items-center">
            <div>
              <div className="text-xs text-gray-400 mb-0.5">Чип</div>
              <div className="font-semibold text-gray-900 text-sm">
                {pet.chip_number ? `Да (${pet.chip_number})` : 'Нет чипа'}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
