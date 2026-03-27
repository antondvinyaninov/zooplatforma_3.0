'use client';

import React from 'react';
import PetsEmptyState from '@/components/modules/pets/list/PetsEmptyState';
import { Pet } from '@/components/modules/pets/list/PetsTable';
import { useRouter } from 'next/navigation';

export default function MobilePetsListLayout({
  title, subtitle, pets, variant, petRoutePrefix,
  extraHeaderActions, setShowModal
}: any) {
  const router = useRouter();

  return (
    <div className="p-4 w-full">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
      </div>

      <div className="flex flex-col gap-2 mb-6">
        {extraHeaderActions}
        <button
          onClick={() => setShowModal(true)}
          className="w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm"
        >
          + Добавить питомца
        </button>
      </div>

      {pets.length === 0 ? (
        <PetsEmptyState onAdd={() => setShowModal(true)} />
      ) : (
        <div className="flex flex-col gap-3">
          {pets.map((pet: Pet) => (
            <div 
              key={pet.id} 
              onClick={() => router.push(`${petRoutePrefix}/${pet.id}`)}
              className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 items-center active:scale-[0.98] transition-all cursor-pointer"
            >
              {/* Аватарка списка */}
              <div className="w-14 h-14 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-200">
                {pet.photo_url || (pet as any).photo ? (
                  <img src={pet.photo_url || (pet as any).photo} alt={pet.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">{pet.species_name?.toLowerCase().includes('кош') ? '🐈' : '🐕'}</span>
                )}
              </div>
              
              {/* Информация карточки в списке */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-gray-900 truncate text-base pr-2">{pet.name}</h3>
                  {pet.org_pet_number && (
                    <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md shrink-0">
                      №{pet.org_pet_number}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {pet.species_name} {pet.breed_name ? `· ${pet.breed_name}` : ''}
                </div>
                <div className="flex gap-2 mt-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${pet.gender === 'male' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>
                    {pet.gender === 'male' ? 'Самец' : 'Самка'}
                  </span>
                  {(pet as any).catalog_status && (pet as any).catalog_status !== 'draft' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-600 font-medium">
                      В каталоге
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
