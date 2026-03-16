'use client';

import { useEffect, useState } from 'react';
import { XMarkIcon, CalendarIcon, MapPinIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { getMediaUrl } from '@/lib/utils';
import { petBaseAPI } from '@/lib/petbase-api';

interface Pet {
  id: number;
  name: string;
  species: string;
  breed?: string;
  gender?: string;
  birth_date?: string;
  color?: string;
  photo?: string;
  is_sterilized?: boolean;
  is_vaccinated?: boolean;
  chip_number?: string;
}

interface PetCardModalProps {
  petId: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function PetCardModal({ petId, isOpen, onClose }: PetCardModalProps) {
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && petId) {
      loadPet();
    }
  }, [isOpen, petId]);

  const loadPet = async () => {
    try {
      setLoading(true);
      const petData = await petBaseAPI.getPet(petId);
      if (petData) {
        setPet(petData);
      }
    } catch (error) {
      console.error('Error loading pet:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAge = () => {
    if (!pet?.birth_date) return null;
    const birthDate = new Date(pet.birth_date);
    const today = new Date();
    const years = today.getFullYear() - birthDate.getFullYear();
    const months = today.getMonth() - birthDate.getMonth();

    if (years > 0) {
      return `${years} ${years === 1 ? 'год' : years < 5 ? 'года' : 'лет'}`;
    } else if (months > 0) {
      return `${months} ${months === 1 ? 'месяц' : months < 5 ? 'месяца' : 'месяцев'}`;
    }
    return 'Новорождённый';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-gray-900">Информация о питомце</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-600 mt-4">Загрузка...</p>
          </div>
        ) : pet ? (
          <div className="p-6">
            {/* Фото */}
            <div className="w-full h-64 rounded-xl overflow-hidden bg-gray-200 mb-6">
              {pet.photo ? (
                <img
                  src={getMediaUrl(pet.photo)}
                  alt={pet.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-6xl">
                  🐾
                </div>
              )}
            </div>

            {/* Имя */}
            <h3 className="text-2xl font-bold text-gray-900 mb-4">{pet.name}</h3>

            {/* Информация о питомце */}
            <div className="space-y-4">
              {/* Вид и порода */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600">🐾</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-500">Кличка</div>
                  <div className="font-medium text-gray-900">{pet.name}</div>
                </div>
              </div>

              {/* Возраст */}
              {pet.birth_date && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <CalendarIcon className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-500">Возраст</div>
                    <div className="font-medium text-gray-900">{getAge()}</div>
                  </div>
                </div>
              )}

              {/* Порода */}
              {pet.breed && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-600">🏆</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-500">Порода</div>
                    <div className="font-medium text-gray-900">
                      {pet.breed === 'Британская короткошерстная'
                        ? 'Британская короткошерстная'
                        : pet.breed}
                    </div>
                  </div>
                </div>
              )}

              {/* Пол */}
              {pet.gender && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600">{pet.gender === 'male' ? '♂' : '♀'}</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-500">Пол</div>
                    <div className="font-medium text-gray-900">
                      {pet.gender === 'male' ? 'Самец' : 'Самка'}
                    </div>
                  </div>
                </div>
              )}

              {/* Окрас/Характер */}
              {pet.color && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-yellow-600">💛</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-500">Характер</div>
                    <div className="font-medium text-gray-900">{pet.color}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Медицинская информация */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Медицинская информация</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-700">Привит</span>
                  <span
                    className={`flex items-center gap-1 ${pet.is_vaccinated ? 'text-green-600' : 'text-gray-400'}`}
                  >
                    {pet.is_vaccinated ? (
                      <>
                        <CheckCircleIcon className="w-5 h-5" />
                        <span className="font-medium">Да</span>
                      </>
                    ) : (
                      <span className="font-medium">Нет данных</span>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-700">Стерилизован</span>
                  <span
                    className={`flex items-center gap-1 ${pet.is_sterilized ? 'text-green-600' : 'text-gray-400'}`}
                  >
                    {pet.is_sterilized ? (
                      <>
                        <CheckCircleIcon className="w-5 h-5" />
                        <span className="font-medium">Да</span>
                      </>
                    ) : (
                      <span className="font-medium">Нет данных</span>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-700">Чипирован</span>
                  <span
                    className={`flex items-center gap-1 ${pet.chip_number ? 'text-green-600' : 'text-gray-400'}`}
                  >
                    {pet.chip_number ? (
                      <>
                        <CheckCircleIcon className="w-5 h-5" />
                        <span className="font-medium">Да</span>
                      </>
                    ) : (
                      <span className="font-medium">Нет данных</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-600">Питомец не найден</p>
          </div>
        )}
      </div>
    </div>
  );
}
